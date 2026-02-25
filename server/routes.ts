import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "https://dev.api.getjoiner.com").replace(/\/$/, "");
const EVENTS_API_KEY = process.env.EVENTS_API_KEY || "kK5uaQWvGJZtSFob2Yc6LApEHDUILFMiFBzOCMDGt2W690mnytREWQMGyq5rNm99";

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

  // Proxy to service feed
  app.get("/api/service/feed", async (req, res) => {
    // Forward query parameters
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${EVENTS_API_URL}/api/service/feed${queryString ? `?${queryString}` : ""}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${EVENTS_API_KEY}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Events API proxy error (feed):", err);
      res.status(502).json({ message: "Failed to fetch service feed" });
    }
  });

  // Proxy to event details
  app.get("/api/service/events/:id", async (req, res) => {
    const url = `${EVENTS_API_URL}/api/service/events/${req.params.id}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${EVENTS_API_KEY}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Events API proxy error (event details):", err);
      res.status(502).json({ message: "Failed to fetch event details" });
    }
  });

  // Proxy for upcoming public events
  app.get("/api/events/upcoming-public", async (req, res) => {
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${EVENTS_API_URL}/api/events/upcoming-public${queryString ? `?${queryString}` : ""}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${EVENTS_API_KEY}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Events API proxy error (upcoming public):", err);
      res.status(502).json({ message: "Failed to fetch upcoming public events" });
    }
  });

  // Proxy for single public event
  app.get("/api/events/:id", async (req, res) => {
    const url = `${EVENTS_API_URL}/api/events/${req.params.id}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${EVENTS_API_KEY}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Events API proxy error (single event):", err);
      res.status(502).json({ message: "Failed to fetch event" });
    }
  });

  return httpServer;
}
