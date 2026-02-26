import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const EVENTS_API_KEY = process.env.EVENTS_API_KEY || "test_api_key";

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

  // Generic proxy to forward requests to the real API and append the secure API key
  app.use("/api/proxied", async (req, res) => {
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
