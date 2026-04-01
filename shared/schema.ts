import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'master_admin' | 'admin' | 'user';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AccountType = 'demo' | 'customer';
export type PasswordEventAction = 'create' | 'reset' | 'change';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string | null;
  username: string | null;
  passwordHash: string | null;
  googleId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  slug: string | null;
  recentUserIds: number[];
  role: UserRole;
  approvalStatus: ApprovalStatus;
  approvedBy: number | null;
  approvedAt: Date | null;
  isActive: boolean;
  isDemo: boolean;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  email?: string | null;
  username?: string | null;
  passwordHash?: string | null;
  googleId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  slug?: string | null;
  recentUserIds?: number[];
  role?: UserRole;
  approvalStatus?: ApprovalStatus;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  isActive?: boolean;
  isDemo?: boolean;
  accountType?: AccountType;
}

// ─── Admin-User Assignments ───────────────────────────────────────────────────

export interface AdminUserAssignment {
  id: number;
  adminId: number;
  userId: number;
  assignedAt: Date;
  assignedBy: number | null;
}

export interface InsertAdminUserAssignment {
  adminId: number;
  userId: number;
  assignedBy?: number | null;
}

// ─── Store Config ─────────────────────────────────────────────────────────────

export interface StoreConfig {
  id: number;
  userId: number | null;
  placeId: string | null;
  businessName: string | null;
  businessNameZh: string | null;
  websiteUrl: string | null;
  googleReviewsUrl: string | null;
  googlePlaceId: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xiaohongshuUrl: string | null;
  tiktokUrl: string | null;
  whatsappUrl: string | null;
  shopPhotos: string[];
  sliderPhotos: string[];
  reviewHashtags: string[];
  companyLogo: string | null;
  hideJustShareNowLogo: boolean;
  updatedAt: Date;
}

export const insertStoreConfigSchema = z.object({
  userId: z.number().optional().nullable(),
  placeId: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  businessNameZh: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  googleReviewsUrl: z.string().optional().nullable(),
  googlePlaceId: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  xiaohongshuUrl: z.string().optional().nullable(),
  tiktokUrl: z.string().optional().nullable(),
  whatsappUrl: z.string().optional().nullable(),
  shopPhotos: z.array(z.string()).optional(),
  sliderPhotos: z.array(z.string()).optional(),
  reviewHashtags: z.array(z.string()).optional(),
  companyLogo: z.string().optional().nullable(),
  hideJustShareNowLogo: z.boolean().optional(),
});

export type InsertStoreConfig = z.infer<typeof insertStoreConfigSchema>;

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface Analytics {
  id: number;
  placeId: string | null;
  platform: string;
  clicks: number;
  lastUpdated: Date;
}

export interface InsertAnalytics {
  placeId?: string | null;
  platform: string;
  clicks?: number;
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: number;
  placeId: string;
  platform: string;
  rating: number;
  reviewText: string | null;
  photoUrl: string | null;
  language: string | null;
  createdAt: Date;
}

export interface InsertTestimonial {
  placeId: string;
  platform: string;
  rating: number;
  reviewText?: string | null;
  photoUrl?: string | null;
  language?: string | null;
}

// ─── Google Reviews ───────────────────────────────────────────────────────────

export interface GoogleReview {
  id: number;
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string | null;
  relativeTime: string | null;
  publishTime: Date | null;
  googleReviewId: string | null;
  createdAt: Date;
}

export interface InsertGoogleReview {
  authorName: string;
  authorPhotoUrl?: string | null;
  rating: number;
  text?: string | null;
  relativeTime?: string | null;
  publishTime?: Date | null;
  googleReviewId?: string | null;
}

// ─── Verified Businesses ──────────────────────────────────────────────────────

export interface VerifiedBusiness {
  id: number;
  placeId: string;
  businessName: string | null;
  address: string | null;
  rating: number | null;
  totalReviews: number | null;
  website: string | null;
  googleMapsUrl: string | null;
  verifiedAt: Date;
}

export interface InsertVerifiedBusiness {
  placeId: string;
  businessName?: string | null;
  address?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  website?: string | null;
  googleMapsUrl?: string | null;
}

// ─── Password Events ──────────────────────────────────────────────────────────

export interface PasswordEvent {
  id: number;
  actorUserId: number;
  targetUserId: number;
  action: PasswordEventAction;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface InsertPasswordEvent {
  actorUserId: number;
  targetUserId: number;
  action: PasswordEventAction;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ─── System Settings ──────────────────────────────────────────────────────────

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: Date;
  updatedBy: number | null;
}

export interface InsertSystemSetting {
  key: string;
  value: string;
  updatedBy?: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_SESSION_TIMEOUT_MINUTES = 10;
