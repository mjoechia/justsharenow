import { 
  storeConfig, 
  analytics,
  googleReviews,
  verifiedBusinesses,
  testimonials,
  users,
  adminUserAssignments,
  passwordEvents,
  systemSettings,
  type StoreConfig, 
  type InsertStoreConfig,
  type Analytics,
  type InsertAnalytics,
  type GoogleReview,
  type InsertGoogleReview,
  type VerifiedBusiness,
  type InsertVerifiedBusiness,
  type Testimonial,
  type InsertTestimonial,
  type User,
  type InsertUser,
  type AdminUserAssignment,
  type InsertAdminUserAssignment,
  type UserRole,
  type ApprovalStatus,
  type PasswordEvent,
  type InsertPasswordEvent,
  type SystemSetting,
  DEFAULT_SESSION_TIMEOUT_MINUTES
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, desc, or, isNull } from "drizzle-orm";

export interface IStorage {
  // Store Configuration - now scoped by placeId or userId
  getStoreConfig(placeId?: string): Promise<StoreConfig | undefined>;
  updateStoreConfig(config: InsertStoreConfig, placeId?: string): Promise<StoreConfig>;
  addShopPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig>;
  addSliderPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig>;
  addShopPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig>;
  addSliderPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig>;
  removeSliderPhotoByUserId(userId: number, photoIndex: number): Promise<StoreConfig>;
  setReviewHashtags(hashtags: string[], placeId?: string): Promise<StoreConfig>;
  getAllBusinesses(): Promise<StoreConfig[]>;
  
  // Analytics - now scoped by placeId (required for tenant isolation)
  getAllAnalytics(placeId?: string): Promise<Analytics[]>;
  getAnalyticsByPlaceId(placeId: string): Promise<Analytics[]>;
  incrementPlatformClick(platform: string, placeId: string): Promise<void>;
  initializePlatforms(platforms: string[], placeId: string): Promise<void>;
  
  // Google Reviews
  getGoogleReviews(): Promise<GoogleReview[]>;
  saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<GoogleReview[]>;
  clearGoogleReviews(): Promise<void>;
  
  // Verified Businesses (cache)
  getVerifiedBusiness(placeId: string): Promise<VerifiedBusiness | undefined>;
  saveVerifiedBusiness(business: InsertVerifiedBusiness): Promise<VerifiedBusiness>;
  
  // Testimonials
  getTestimonials(placeId: string): Promise<Testimonial[]>;
  saveTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  // User Authentication & Management
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserBySlug(slug: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  getPendingApprovals(): Promise<User[]>;
  approveUser(userId: number, approvedBy: number): Promise<User>;
  rejectUser(userId: number): Promise<User>;
  updatePassword(userId: number, passwordHash: string): Promise<User>;
  
  // Admin-User Assignments
  assignUserToAdmin(adminId: number, userId: number, assignedBy: number): Promise<AdminUserAssignment>;
  removeUserFromAdmin(adminId: number, userId: number): Promise<void>;
  getUsersForAdmin(adminId: number): Promise<User[]>;
  getAdminForUser(userId: number): Promise<User | undefined>;
  getAssignmentsForAdmin(adminId: number): Promise<AdminUserAssignment[]>;
  
  // Store Config by User
  getStoreConfigByUserId(userId: number): Promise<StoreConfig | undefined>;
  getStoreConfigByPlaceId(placeId: string): Promise<StoreConfig | undefined>;
  createStoreConfigForUser(userId: number): Promise<StoreConfig>;
  updateStoreConfigByUserId(userId: number, configData: InsertStoreConfig): Promise<StoreConfig>;
  
  // Password Audit Events
  logPasswordEvent(event: InsertPasswordEvent): Promise<PasswordEvent>;
  getPasswordEvents(targetUserId?: number): Promise<PasswordEvent[]>;
  
  // Active Admins
  getActiveAdmins(): Promise<User[]>;
  
  // Recent Users for Admins
  addRecentUser(adminId: number, userId: number): Promise<void>;
  
  // System Settings
  getSystemSetting(key: string): Promise<string | undefined>;
  setSystemSetting(key: string, value: string, updatedBy?: number): Promise<SystemSetting>;
  getSessionTimeoutMinutes(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getStoreConfig(placeId?: string): Promise<StoreConfig | undefined> {
    // placeId is now required for tenant isolation - throw if not provided
    // Use getStoreConfigByPlaceId or getStoreConfigByUserId instead for explicit scoping
    if (!placeId) {
      throw new Error("placeId is required for getStoreConfig - use getStoreConfigByPlaceId or getStoreConfigByUserId for explicit tenant scoping");
    }
    const [config] = await db.select().from(storeConfig).where(eq(storeConfig.placeId, placeId)).limit(1);
    return config || undefined;
  }

  async updateStoreConfig(configData: InsertStoreConfig, placeId?: string): Promise<StoreConfig> {
    const targetPlaceId = placeId || configData.placeId;
    
    // placeId is now required for tenant isolation
    if (!targetPlaceId) {
      throw new Error("placeId is required for updateStoreConfig - use updateStoreConfigByUserId for user-scoped updates");
    }
    
    // Check if config exists for this business
    const existing = await this.getStoreConfigByPlaceId(targetPlaceId);
    
    if (existing) {
      // Update existing config
      const updateData: any = { ...configData, updatedAt: sql`NOW()` };
      const [updated] = await db
        .update(storeConfig)
        .set(updateData)
        .where(eq(storeConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new config for this business
      const [created] = await db
        .insert(storeConfig)
        .values({ ...configData, placeId: targetPlaceId } as any)
        .returning();
      return created;
    }
  }

  async addShopPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig> {
    // placeId is now required for tenant isolation
    if (!placeId) {
      throw new Error("placeId is required for addShopPhoto");
    }
    
    const existing = await this.getStoreConfigByPlaceId(placeId);
    const currentPhotos = existing?.shopPhotos || [];
    
    if (currentPhotos.length >= 9) {
      throw new Error("Maximum of 9 photos allowed");
    }
    
    const newPhotos = [...currentPhotos, photoBase64];
    
    if (existing) {
      const [updated] = await db
        .update(storeConfig)
        .set({ 
          shopPhotos: newPhotos,
          updatedAt: sql`NOW()` 
        })
        .where(eq(storeConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(storeConfig)
        .values({ shopPhotos: newPhotos, placeId } as any)
        .returning();
      return created;
    }
  }

  async addSliderPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig> {
    // placeId is now required for tenant isolation
    if (!placeId) {
      throw new Error("placeId is required for addSliderPhoto");
    }
    
    const existing = await this.getStoreConfigByPlaceId(placeId);
    const currentPhotos = existing?.sliderPhotos || [];
    
    if (currentPhotos.length >= 3) {
      throw new Error("Maximum of 3 slider photos allowed");
    }
    
    const newPhotos = [...currentPhotos, photoBase64];
    
    if (existing) {
      const [updated] = await db
        .update(storeConfig)
        .set({ 
          sliderPhotos: newPhotos,
          updatedAt: sql`NOW()` 
        })
        .where(eq(storeConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(storeConfig)
        .values({ sliderPhotos: newPhotos, placeId } as any)
        .returning();
      return created;
    }
  }

  async addShopPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig> {
    let existing = await this.getStoreConfigByUserId(userId);
    
    if (!existing) {
      // Create config for this user if it doesn't exist
      existing = await this.createStoreConfigForUser(userId);
    }
    
    const currentPhotos = existing?.shopPhotos || [];
    
    if (currentPhotos.length >= 9) {
      throw new Error("Maximum of 9 shop photos allowed");
    }
    
    const newPhotos = [...currentPhotos, photoBase64];
    
    const [updated] = await db
      .update(storeConfig)
      .set({ 
        shopPhotos: newPhotos,
        updatedAt: sql`NOW()` 
      })
      .where(eq(storeConfig.id, existing.id))
      .returning();
    return updated;
  }

  async addSliderPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig> {
    let existing = await this.getStoreConfigByUserId(userId);
    
    if (!existing) {
      // Create config for this user if it doesn't exist
      existing = await this.createStoreConfigForUser(userId);
    }
    
    const currentPhotos = existing?.sliderPhotos || [];
    
    if (currentPhotos.length >= 3) {
      throw new Error("Maximum of 3 slider photos allowed");
    }
    
    const newPhotos = [...currentPhotos, photoBase64];
    
    const [updated] = await db
      .update(storeConfig)
      .set({ 
        sliderPhotos: newPhotos,
        updatedAt: sql`NOW()` 
      })
      .where(eq(storeConfig.id, existing.id))
      .returning();
    return updated;
  }

  async removeSliderPhotoByUserId(userId: number, photoIndex: number): Promise<StoreConfig> {
    const existing = await this.getStoreConfigByUserId(userId);
    
    if (!existing) {
      throw new Error("Config not found for user");
    }
    
    const currentPhotos = existing?.sliderPhotos || [];
    
    if (photoIndex < 0 || photoIndex >= currentPhotos.length) {
      throw new Error("Invalid photo index");
    }
    
    const newPhotos = currentPhotos.filter((_, i) => i !== photoIndex);
    
    const [updated] = await db
      .update(storeConfig)
      .set({ 
        sliderPhotos: newPhotos,
        updatedAt: sql`NOW()` 
      })
      .where(eq(storeConfig.id, existing.id))
      .returning();
    return updated;
  }

  async setReviewHashtags(hashtags: string[], placeId?: string): Promise<StoreConfig> {
    // placeId is now required for tenant isolation
    if (!placeId) {
      throw new Error("placeId is required for setReviewHashtags");
    }
    
    const existing = await this.getStoreConfigByPlaceId(placeId);
    
    // Normalize hashtags: ensure # prefix, dedupe, limit to 12
    const withPrefix = hashtags
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      .slice(0, 12);
    const normalized = Array.from(new Set(withPrefix));
    
    if (existing) {
      const [updated] = await db
        .update(storeConfig)
        .set({ 
          reviewHashtags: normalized,
          updatedAt: sql`NOW()` 
        })
        .where(eq(storeConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(storeConfig)
        .values({ reviewHashtags: normalized, placeId } as any)
        .returning();
      return created;
    }
  }

  async getAllBusinesses(): Promise<StoreConfig[]> {
    return await db.select().from(storeConfig).where(sql`${storeConfig.placeId} IS NOT NULL`);
  }

  async getAllAnalytics(placeId?: string): Promise<Analytics[]> {
    // Always require placeId for tenant isolation - the optional parameter
    // is kept for interface compatibility but we throw if not provided
    if (!placeId) {
      throw new Error("placeId is required for getAllAnalytics - use getAnalyticsByPlaceId instead");
    }
    return await db.select().from(analytics).where(eq(analytics.placeId, placeId));
  }

  async getAnalyticsByPlaceId(placeId: string): Promise<Analytics[]> {
    return await db.select().from(analytics).where(eq(analytics.placeId, placeId));
  }

  async incrementPlatformClick(platform: string, placeId: string): Promise<void> {
    // placeId is now required for tenant isolation
    const existing = await db.select().from(analytics)
      .where(and(eq(analytics.platform, platform), eq(analytics.placeId, placeId)))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(analytics)
        .set({ 
          clicks: sql`${analytics.clicks} + 1`,
          lastUpdated: new Date() 
        })
        .where(eq(analytics.id, existing[0].id));
    } else {
      await db.insert(analytics).values({ platform, placeId, clicks: 1 });
    }
  }

  async initializePlatforms(platforms: string[], placeId: string): Promise<void> {
    // placeId is now required for tenant isolation
    for (const platform of platforms) {
      const existing = await db.select().from(analytics)
        .where(and(eq(analytics.platform, platform), eq(analytics.placeId, placeId)))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(analytics).values({ platform, placeId, clicks: 0 });
      }
    }
  }

  async getGoogleReviews(): Promise<GoogleReview[]> {
    return await db.select().from(googleReviews).orderBy(googleReviews.rating);
  }

  async saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<GoogleReview[]> {
    if (reviews.length === 0) return [];
    
    // Clear existing reviews first
    await this.clearGoogleReviews();
    
    // Insert new reviews
    const inserted = await db
      .insert(googleReviews)
      .values(reviews)
      .returning();
    
    return inserted;
  }

  async clearGoogleReviews(): Promise<void> {
    await db.delete(googleReviews);
  }

  async getVerifiedBusiness(placeId: string): Promise<VerifiedBusiness | undefined> {
    const [business] = await db
      .select()
      .from(verifiedBusinesses)
      .where(eq(verifiedBusinesses.placeId, placeId))
      .limit(1);
    return business || undefined;
  }

  async saveVerifiedBusiness(business: InsertVerifiedBusiness): Promise<VerifiedBusiness> {
    // Upsert: update if exists, insert if not
    const [saved] = await db
      .insert(verifiedBusinesses)
      .values({ ...business, verifiedAt: sql`NOW()` } as any)
      .onConflictDoUpdate({
        target: verifiedBusinesses.placeId,
        set: {
          businessName: business.businessName,
          address: business.address,
          rating: business.rating,
          totalReviews: business.totalReviews,
          website: business.website,
          googleMapsUrl: business.googleMapsUrl,
          verifiedAt: sql`NOW()`,
        },
      })
      .returning();
    return saved;
  }

  async getTestimonials(placeId: string): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.placeId, placeId))
      .orderBy(desc(testimonials.createdAt));
  }

  async saveTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [saved] = await db
      .insert(testimonials)
      .values(testimonial)
      .returning();
    return saved;
  }

  // User Authentication & Management
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return user || undefined;
  }

  async getUserBySlug(slug: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user as any).returning();
    return created;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: sql`NOW()` } as any)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(adminUserAssignments).where(
      or(eq(adminUserAssignments.adminId, id), eq(adminUserAssignments.userId, id))
    );
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
  }

  async getPendingApprovals(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.approvalStatus, 'pending')).orderBy(users.createdAt);
  }

  async approveUser(userId: number, approvedBy: number): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        approvalStatus: 'approved', 
        approvedBy, 
        approvedAt: sql`NOW()`,
        updatedAt: sql`NOW()` 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async rejectUser(userId: number): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        approvalStatus: 'rejected',
        updatedAt: sql`NOW()` 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updatePassword(userId: number, passwordHash: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ passwordHash, updatedAt: sql`NOW()` })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Admin-User Assignments
  async assignUserToAdmin(adminId: number, userId: number, assignedBy: number): Promise<AdminUserAssignment> {
    // Remove existing assignment if any
    await db.delete(adminUserAssignments).where(eq(adminUserAssignments.userId, userId));
    
    // Create new assignment
    const [assignment] = await db
      .insert(adminUserAssignments)
      .values({ adminId, userId, assignedBy })
      .returning();
    return assignment;
  }

  async removeUserFromAdmin(adminId: number, userId: number): Promise<void> {
    await db.delete(adminUserAssignments).where(
      and(eq(adminUserAssignments.adminId, adminId), eq(adminUserAssignments.userId, userId))
    );
  }

  async getUsersForAdmin(adminId: number): Promise<User[]> {
    console.log(`[getUsersForAdmin] Looking up assignments for adminId=${adminId}`);
    const assignments = await db
      .select({ userId: adminUserAssignments.userId })
      .from(adminUserAssignments)
      .where(eq(adminUserAssignments.adminId, adminId));
    
    console.log(`[getUsersForAdmin] Found ${assignments.length} assignments for adminId=${adminId}:`, assignments.map(a => a.userId));
    
    if (assignments.length === 0) return [];
    
    const userIds = assignments.map(a => a.userId);
    const result: User[] = [];
    for (const userId of userIds) {
      const user = await this.getUserById(userId);
      if (user) result.push(user);
    }
    console.log(`[getUsersForAdmin] Returning ${result.length} users for adminId=${adminId}`);
    return result;
  }

  async getAdminForUser(userId: number): Promise<User | undefined> {
    const [assignment] = await db
      .select()
      .from(adminUserAssignments)
      .where(eq(adminUserAssignments.userId, userId))
      .limit(1);
    
    if (!assignment) return undefined;
    return this.getUserById(assignment.adminId);
  }

  async getAssignmentsForAdmin(adminId: number): Promise<AdminUserAssignment[]> {
    return await db.select().from(adminUserAssignments).where(eq(adminUserAssignments.adminId, adminId));
  }

  // Store Config by User
  async getStoreConfigByUserId(userId: number): Promise<StoreConfig | undefined> {
    const [config] = await db.select().from(storeConfig).where(eq(storeConfig.userId, userId)).limit(1);
    return config || undefined;
  }

  async getStoreConfigByPlaceId(placeId: string): Promise<StoreConfig | undefined> {
    const [config] = await db.select().from(storeConfig).where(eq(storeConfig.placeId, placeId)).limit(1);
    return config || undefined;
  }

  async createStoreConfigForUser(userId: number): Promise<StoreConfig> {
    const [created] = await db
      .insert(storeConfig)
      .values({ userId } as any)
      .returning();
    return created;
  }

  async updateStoreConfigByUserId(userId: number, configData: InsertStoreConfig): Promise<StoreConfig> {
    const existing = await this.getStoreConfigByUserId(userId);
    
    if (existing) {
      // Prevent tampering: ignore caller-supplied userId/placeId if config already exists
      // placeId should remain consistent once set, and userId is always the target
      const { userId: _, placeId: __, ...safeData } = configData as any;
      const updateData: any = { ...safeData, updatedAt: sql`NOW()` };
      const [updated] = await db
        .update(storeConfig)
        .set(updateData)
        .where(and(eq(storeConfig.id, existing.id), eq(storeConfig.userId, userId)))
        .returning();
      return updated;
    } else {
      // Create new config for this user - allow setting placeId on first creation
      const [created] = await db
        .insert(storeConfig)
        .values({ ...configData, userId } as any)
        .returning();
      return created;
    }
  }

  // Password Audit Events
  async logPasswordEvent(event: InsertPasswordEvent): Promise<PasswordEvent> {
    const [created] = await db.insert(passwordEvents).values(event as any).returning();
    return created;
  }

  async getPasswordEvents(targetUserId?: number): Promise<PasswordEvent[]> {
    if (targetUserId) {
      return await db
        .select()
        .from(passwordEvents)
        .where(eq(passwordEvents.targetUserId, targetUserId))
        .orderBy(desc(passwordEvents.createdAt));
    }
    return await db.select().from(passwordEvents).orderBy(desc(passwordEvents.createdAt));
  }

  // Active Admins
  async getActiveAdmins(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'admin'),
          eq(users.isActive, true),
          eq(users.approvalStatus, 'approved')
        )
      );
  }

  // Add to recent users list for an admin (keep last 3)
  async addRecentUser(adminId: number, userId: number): Promise<void> {
    const admin = await this.getUserById(adminId);
    if (!admin) return;
    
    const currentRecent = (admin.recentUserIds as number[]) || [];
    // Remove userId if already exists, then add to front
    const filtered = currentRecent.filter(id => id !== userId);
    const newRecent = [userId, ...filtered].slice(0, 3);
    
    await db
      .update(users)
      .set({ recentUserIds: newRecent } as any)
      .where(eq(users.id, adminId));
  }

  // System Settings
  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return setting?.value;
  }

  async setSystemSetting(key: string, value: string, updatedBy?: number): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(key);
    
    if (existing !== undefined) {
      const [updated] = await db
        .update(systemSettings)
        .set({ value, updatedAt: sql`NOW()`, updatedBy })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemSettings)
        .values({ key, value, updatedBy } as any)
        .returning();
      return created;
    }
  }

  async getSessionTimeoutMinutes(): Promise<number> {
    const value = await this.getSystemSetting('session_timeout_minutes');
    if (value) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }
}

export const storage = new DatabaseStorage();
