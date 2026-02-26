import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "").trim();
const EVENTS_API_KEY = (process.env.EVENTS_API_KEY || "test_api_key").trim();

console.log(`[BOOT] Events API URL configured as: ${EVENTS_API_URL}`);
console.log(`[BOOT] Events API Key starts with: ${EVENTS_API_KEY.substring(0, 5)}... (Length: ${EVENTS_API_KEY.length})`);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Proxy to real events API (all-feed)
  app.get("/api/all-feed", async (req, res) => {
    const clientId = req.query.client_id ?? "1";
    const url = `${EVENTS_API_URL}/api/all-feed?client_id=${clientId}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${EVENTS_API_KEY}`,
        },
      });
      const text = await response.text();
      if (!response.ok) {
        const message =
          text.startsWith("{") && text.trim().endsWith("}")
            ? (JSON.parse(text) as { message?: string }).message ?? response.statusText
            : response.statusText || "Events API error";
        return res.status(response.status).json({ message });
      }
      const data = JSON.parse(text) as unknown;
      res.json(data);
    } catch (err) {
      console.error("Events API proxy error:", err);
      res.status(502).json({ message: "Failed to fetch events feed" });
    }
  });

  // Generic proxy to hide real API URL and KEY from the frontend
  app.use("/api/proxied", async (req, res) => {
    // req.originalUrl could be /api/proxied/api/service/feed?page=1
    // We want to fetch EVENTS_API_URL + /api/service/feed?page=1
    const targetPathAndQuery = req.originalUrl.replace("/api/proxied", "");
    const url = `${EVENTS_API_URL}${targetPathAndQuery}`;

    try {
      console.log(`[PROXY] Fetching: ${url}`);

      const response = await fetch(url, {
        method: req.method,
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${EVENTS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
      });

      const text = await response.text();

      if (!response.ok) {
        console.error(`[PROXY FAIL] ${response.status} ${response.statusText} for ${url}`);
        console.error(`[PROXY FAIL BODY] ${text.substring(0, 200)}`);
        let message = response.statusText || "Events API error";
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
