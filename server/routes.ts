import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStoreConfigSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize default platforms
  const defaultPlatforms = ['google', 'facebook', 'instagram', 'xiaohongshu', 'follow-facebook', 'follow-instagram'];
  await storage.initializePlatforms(defaultPlatforms);

  // Store Configuration Routes
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await storage.getStoreConfig();
      res.json(config || {
        websiteUrl: null,
        googleUrl: null,
        facebookUrl: null,
        instagramUrl: null,
        xiaohongshuUrl: null,
        shopPhotos: [],
      });
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.put("/api/config", async (req, res) => {
    try {
      const validatedData = insertStoreConfigSchema.parse(req.body);
      const config = await storage.updateStoreConfig(validatedData);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating config:", error);
        res.status(500).json({ error: "Failed to update configuration" });
      }
    }
  });

  // Analytics Routes
  app.get("/api/analytics", async (_req, res) => {
    try {
      const analytics = await storage.getAllAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { platform } = req.body;
      if (!platform || typeof platform !== 'string') {
        res.status(400).json({ error: "Platform is required" });
        return;
      }
      await storage.incrementPlatformClick(platform);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  return httpServer;
}
