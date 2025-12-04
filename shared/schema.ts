import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Store Configuration (single row table)
export const storeConfig = pgTable("store_config", {
  id: serial("id").primaryKey(),
  websiteUrl: text("website_url"),
  googleReviewsUrl: text("google_reviews_url"),
  googlePlaceId: text("google_place_id"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  xiaohongshuUrl: text("xiaohongshu_url"),
  tiktokUrl: text("tiktok_url"),
  whatsappUrl: text("whatsapp_url"),
  shopPhotos: jsonb("shop_photos").$type<string[]>().default([]),
  sliderPhotos: jsonb("slider_photos").$type<string[]>().default([]),
  reviewHashtags: jsonb("review_hashtags").$type<string[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStoreConfigSchema = createInsertSchema(storeConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertStoreConfig = z.infer<typeof insertStoreConfigSchema>;
export type StoreConfig = typeof storeConfig.$inferSelect;

// Analytics Tracking
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(),
  clicks: integer("clicks").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  lastUpdated: true,
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
