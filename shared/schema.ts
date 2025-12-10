import { pgTable, text, serial, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";
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

// Google Reviews
export const googleReviews = pgTable("google_reviews", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  authorPhotoUrl: text("author_photo_url"),
  rating: integer("rating").notNull(),
  text: text("text"),
  relativeTime: text("relative_time"),
  publishTime: timestamp("publish_time"),
  googleReviewId: text("google_review_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoogleReviewSchema = createInsertSchema(googleReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertGoogleReview = z.infer<typeof insertGoogleReviewSchema>;
export type GoogleReview = typeof googleReviews.$inferSelect;

// Verified Businesses (cache for Google Places API lookups)
export const verifiedBusinesses = pgTable("verified_businesses", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull().unique(),
  businessName: text("business_name"),
  address: text("address"),
  rating: real("rating"),
  totalReviews: integer("total_reviews").default(0),
  website: text("website"),
  googleMapsUrl: text("google_maps_url"),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
});

export const insertVerifiedBusinessSchema = createInsertSchema(verifiedBusinesses).omit({
  id: true,
  verifiedAt: true,
});

export type InsertVerifiedBusiness = z.infer<typeof insertVerifiedBusinessSchema>;
export type VerifiedBusiness = typeof verifiedBusinesses.$inferSelect;
