import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabaseClient";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { refineDescription, generateImageFromPrompt } from "./ai";
import { getGaMetrics, getTopEvents } from "./analyticsApi";

// --- Analytics Config Store (Supabase-backed with in-memory cache) ---

interface AnalyticsConfig {
  gtm_id?: string;
  meta_pixel_id?: string;
  ga_measurement_id?: string;
  clarity_id?: string;
  hotjar_id?: string;
  hotjar_sv?: string;
  mixpanel_token?: string;
  allowed_countries?: string[];
  is_login_enabled?: boolean;
}

let analyticsConfig: AnalyticsConfig = {};
let configCacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

async function loadConfigFromSupabase(): Promise<AnalyticsConfig> {
  if (!supabase) return analyticsConfig;
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "analytics")
      .single();
    if (error && error.code !== "PGRST116") {
      // PGRST116 = row not found, which is fine for first run
      console.warn("[Supabase] Error loading config:", error.message);
    }
    if (data?.value) {
      analyticsConfig = data.value as AnalyticsConfig;
      configCacheTime = Date.now();
      console.log("[Supabase] Loaded analytics config from database.");
    }
  } catch (e) {
    console.warn("[Supabase] Could not load analytics config:", e);
  }
  return analyticsConfig;
}

async function saveConfigToSupabase(config: AnalyticsConfig): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("app_config")
      .upsert(
        { key: "analytics", value: config, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      console.error("[Supabase] Error saving config:", error.message);
      return false;
    }
    configCacheTime = Date.now();
    console.log("[Supabase] Analytics config saved to database.");
    return true;
  } catch (e) {
    console.error("[Supabase] Could not persist analytics config:", e);
    return false;
  }
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return analyticsConfig;
}

// Load config from Supabase on startup
loadConfigFromSupabase();

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "https://api.getjoiner.com").replace(/\/$/, "");
const rawApiKey = process.env.EVENTS_API_KEY || "";
if (!rawApiKey) {
  console.error("WARNING: EVENTS_API_KEY environment variable is not defined. Proxy requests will likely fail.");
}

const AUTH_HEADER = rawApiKey.toLowerCase().startsWith('bearer ') ? rawApiKey : `Bearer ${rawApiKey}`;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Upload Image to Cloudinary Endpoint
  // --- Global API Middleware (CORS, Preflight, Logs) ---
  app.use("/api", (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://joiner.social",
      "https://events.getjoiner.com",
      "https://getjoiner.com",
      "http://localhost:5000",
      "http://localhost:5173",
      "http://0.0.0.0:5000",
      "http://0.0.0.0:5173"
    ];

    if (origin) {
      const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".a.run.app");
      if (isAllowed || process.env.NODE_ENV !== "production") {
        res.setHeader("Access-Control-Allow-Origin", origin);
      } else {
        res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
      }
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, session_id, request_id, J-LOCALE");
    }

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });

  // Upload Image to Cloudinary Endpoint
  app.post("/api/upload-image", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "joiner_events", // optional folder in Cloudinary
      });

      res.json({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // AI Refinement of event description
  app.post("/api/ai/refine-description", async (req, res) => {
    console.log("[AI Endpoint] POST /api/ai/refine-description hit");
    try {
      const { description } = req.body;
      if (!description) return res.status(400).json({ error: "No description provided" });
      
      console.log(`[AI Endpoint] Refining: ${description.substring(0, 50)}...`);
      const refined = await refineDescription(description);
      console.log(`[AI Endpoint] Refined successfully!`);
      
      res.json({ refined });
    } catch (err) {
      console.error("[AI Endpoint] Error refining description:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // AI Image generation
  app.post("/api/ai/generate-image", async (req, res) => {
    console.log("[AI Endpoint] POST /api/ai/generate-image hit");
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });
      
      console.log(`[AI Endpoint] Generating image for prompt: ${prompt}`);
      const result = await generateImageFromPrompt(prompt);
      console.log(`[AI Endpoint] Image generated: ${result.url.substring(0, 30)}...`);
      
      res.json(result);
    } catch (err) {
      console.error("[AI Endpoint] Error generating image:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });
  // Admin: get analytics config (with cache refresh)
  app.get("/api/admin/analytics-config", async (_req, res) => {
    if (supabase && Date.now() - configCacheTime > CACHE_TTL_MS) {
      await loadConfigFromSupabase();
    }
    res.json(analyticsConfig);
  });

  // Admin: save analytics config (to Supabase)
  app.post("/api/admin/analytics-config", async (req, res) => {
    const incoming = req.body as AnalyticsConfig;
    analyticsConfig = { ...analyticsConfig, ...incoming };
    await saveConfigToSupabase(analyticsConfig);
    res.json({ ok: true });
  });

  // Admin: get Google Analytics stats
  app.get("/api/admin/ga-stats", async (_req, res) => {
    try {
      const metrics = await getGaMetrics();
      const topEvents = await getTopEvents();
      
      if (!metrics) {
        return res.status(404).json({ error: "Google Analytics not configured or property ID missing." });
      }

      res.json({
        metrics,
        topEvents
      });
    } catch (err) {
      console.error("[Admin API] GA Stats error:", err);
      res.status(500).json({ error: "Failed to fetch GA metrics" });
    }
  });

  // Generic proxy to forward requests to the real API and append the secure API key
  app.use("/api/proxied", async (req, res) => {
    const targetPathAndQuery = req.originalUrl.replace("/api/proxied", "");
    const url = `${EVENTS_API_URL}${targetPathAndQuery}`;
    console.log(`[Proxy] Forwarding ${req.method} ${req.originalUrl} -> ${url}`);

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: {
          "Accept": "application/json",
          "Authorization": req.headers.authorization || AUTH_HEADER,
          "Content-Type": "application/json",
          "session_id": req.headers.session_id as string || "",
          "request_id": req.headers.request_id as string || "",
          "J-LOCALE": req.headers["j-locale"] as string || "en",
        },
        body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
      });

      const text = await response.text();

      if (!response.ok) {
        let message = response.statusText;
        try {
          if (text.startsWith("{") && text.trim().endsWith("}")) {
            message = (JSON.parse(text) as { message?: string }).message ?? message;
          }
        } catch (e) { }
        return res.status(response.status).json({ message });
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Events API generic proxy error:", err);
      res.status(502).json({ message: "Failed to fetch from events API" });
    }
  });

  return httpServer;
}
