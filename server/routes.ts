import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";

function getSecret(name: string, fallback: string = ""): string {
  // 1. Try Environment Variables
  const val = process.env[name];
  if (val && val.trim().length > 0) {
    return val.trim();
  }

  // 2. Try common Google Cloud Run / Docker Secret Mount paths
  const paths = [
    `/secrets/${name}`,
    `/run/secrets/${name}`,
    `/etc/secrets/${name}`,
    `/var/run/secrets/${name}`
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const fileVal = fs.readFileSync(p, "utf-8").trim();
        if (fileVal.length > 0) return fileVal;
      }
    } catch (e) { }
  }

  return fallback;
}

if (!getSecret("EVENTS_API_KEY")) {
  console.warn("WARNING: EVENTS_API_KEY is not set globally. API calls will fail.");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Proxy to real events API (all-feed)
  app.get("/api/all-feed", async (req, res) => {
    const apiURL = getSecret("EVENTS_API_URL", "https://dev.api.getjoiner.com").replace(/\/$/, "");
    const apiKey = getSecret("EVENTS_API_KEY");
    const clientId = req.query.client_id ?? "1";
    const url = `${apiURL}/api/all-feed?client_id=${clientId}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
    const apiURL = getSecret("EVENTS_API_URL", "https://dev.api.getjoiner.com").replace(/\/$/, "");
    const apiKey = getSecret("EVENTS_API_KEY");
    // Forward query parameters
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${apiURL}/api/service/feed${queryString ? `?${queryString}` : ""}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
    const apiURL = getSecret("EVENTS_API_URL", "https://dev.api.getjoiner.com").replace(/\/$/, "");
    const apiKey = getSecret("EVENTS_API_KEY");
    const url = `${apiURL}/api/service/events/${req.params.id}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
    const apiURL = getSecret("EVENTS_API_URL", "https://dev.api.getjoiner.com").replace(/\/$/, "");
    const apiKey = getSecret("EVENTS_API_KEY");
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${apiURL}/api/events/upcoming-public${queryString ? `?${queryString}` : ""}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
    const apiURL = getSecret("EVENTS_API_URL", "https://dev.api.getjoiner.com").replace(/\/$/, "");
    const apiKey = getSecret("EVENTS_API_KEY");
    const url = `${apiURL}/api/events/${req.params.id}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
