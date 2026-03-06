import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "https://api.getjoiner.com").replace(/\/$/, "");
const rawApiKey = process.env.EVENTS_API_KEY;
if (!rawApiKey) {
  console.error("FATAL: EVENTS_API_KEY environment variable is required");
  process.exit(1);
}
const AUTH_HEADER = rawApiKey.toLowerCase().startsWith('bearer ') ? rawApiKey : `Bearer ${rawApiKey}`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
