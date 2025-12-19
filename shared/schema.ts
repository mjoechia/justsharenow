import { pgTable, text, serial, integer, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles
export type UserRole = 'master_admin' | 'admin' | 'user';

// Approval Status
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Users table - stores all users with roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  username: text("username").unique(),
  passwordHash: text("password_hash"), // For master admin (username/password login)
  googleId: text("google_id").unique(), // For Google OAuth (admins)
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  slug: text("slug").unique(), // URL slug for accessing user's shop/quick view (e.g., /carin141319)
  recentUserIds: jsonb("recent_user_ids").$type<number[]>().default([]), // For admins: last 3 users they viewed
  role: text("role").$type<UserRole>().notNull().default('user'),
  approvalStatus: text("approval_status").$type<ApprovalStatus>().notNull().default('pending'),
  approvedBy: integer("approved_by"), // References users.id of who approved
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Admin-User Assignments - which users are managed by which admin
export const adminUserAssignments = pgTable("admin_user_assignments", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(), // References users.id (must be role='admin')
  userId: integer("user_id").notNull(), // References users.id (must be role='user')
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by"), // References users.id of master admin who made assignment
});

export const insertAdminUserAssignmentSchema = createInsertSchema(adminUserAssignments).omit({
  id: true,
  assignedAt: true,
});

export type InsertAdminUserAssignment = z.infer<typeof insertAdminUserAssignmentSchema>;
export type AdminUserAssignment = typeof adminUserAssignments.$inferSelect;

// Sessions table for connect-pg-simple (Replit Auth / Express Session)
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export type Session = typeof sessions.$inferSelect;

// Store Configuration - now scoped by user and business (placeId)
export const storeConfig = pgTable("store_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // References users.id - each user has their own store config
  placeId: text("place_id").unique(),
  businessName: text("business_name"),
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

// Analytics Tracking - now scoped by business (placeId)
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  placeId: text("place_id"),
  platform: text("platform").notNull(),
  clicks: integer("clicks").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  lastUpdated: true,
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Testimonials - customer-submitted reviews
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  platform: text("platform").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text"),
  photoUrl: text("photo_url"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

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

// Password Event Types
export type PasswordEventAction = 'create' | 'reset' | 'change';

// Password Events - audit trail for password operations
export const passwordEvents = pgTable("password_events", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").notNull(), // Who performed the action
  targetUserId: integer("target_user_id").notNull(), // Who the action was performed on
  action: text("action").$type<PasswordEventAction>().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordEventSchema = createInsertSchema(passwordEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordEvent = z.infer<typeof insertPasswordEventSchema>;
export type PasswordEvent = typeof passwordEvents.$inferSelect;
