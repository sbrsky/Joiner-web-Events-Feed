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

  return httpServer;
}
