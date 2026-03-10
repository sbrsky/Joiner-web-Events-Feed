import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

// --- Analytics Config Store ---
const CONFIG_PATH = path.resolve(process.cwd(), "analytics-config.json");

interface AnalyticsConfig {
  gtm_id?: string;
  meta_pixel_id?: string;
  ga_measurement_id?: string;
  clarity_id?: string;
  hotjar_id?: string;
  hotjar_sv?: string;
  mixpanel_token?: string;
}

let analyticsConfig: AnalyticsConfig = {};

try {
  if (fs.existsSync(CONFIG_PATH)) {
    analyticsConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    console.log("[Admin] Loaded analytics config from disk.");
  }
} catch (e) {
  console.warn("[Admin] Could not load analytics config:", e);
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return analyticsConfig;
}

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "https://api.getjoiner.com").replace(/\/$/, "");
const rawApiKey = process.env.EVENTS_API_KEY || "";
if (!rawApiKey) {
  console.error("WARNING: EVENTS_API_KEY environment variable is not defined. Proxy requests will likely fail.");
}
const AUTH_HEADER = rawApiKey.toLowerCase().startsWith('bearer ') ? rawApiKey : `Bearer ${rawApiKey}`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Admin: get analytics config
  app.get("/api/admin/analytics-config", (_req, res) => {
    res.json(analyticsConfig);
  });

  // Admin: save analytics config
  app.post("/api/admin/analytics-config", (req, res) => {
    const incoming = req.body as AnalyticsConfig;
    analyticsConfig = { ...analyticsConfig, ...incoming };
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(analyticsConfig, null, 2), "utf-8");
    } catch (e) {
      console.warn("[Admin] Could not persist analytics config to disk:", e);
    }
    res.json({ ok: true });
  });
  // Enforce CORS to ensure only our frontend can reach the proxy API
  app.use("/api", (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://joiner.social",
      "https://events.getjoiner.com",
      "https://getjoiner.com",
      "http://localhost:5000",
      "http://localhost:5173"
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


  // Generic proxy to forward requests to the real API and append the secure API key
  app.use("/api/proxied", async (req, res) => {
    const targetPathAndQuery = req.originalUrl.replace("/api/proxied", "");
    const url = `${EVENTS_API_URL}${targetPathAndQuery}`;

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
