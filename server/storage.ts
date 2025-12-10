import { 
  storeConfig, 
  analytics,
  googleReviews,
  verifiedBusinesses,
  type StoreConfig, 
  type InsertStoreConfig,
  type Analytics,
  type InsertAnalytics,
  type GoogleReview,
  type InsertGoogleReview,
  type VerifiedBusiness,
  type InsertVerifiedBusiness
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Store Configuration
  getStoreConfig(): Promise<StoreConfig | undefined>;
  updateStoreConfig(config: InsertStoreConfig): Promise<StoreConfig>;
  addShopPhoto(photoBase64: string): Promise<StoreConfig>;
  addSliderPhoto(photoBase64: string): Promise<StoreConfig>;
  setReviewHashtags(hashtags: string[]): Promise<StoreConfig>;
  
  // Analytics
  getAllAnalytics(): Promise<Analytics[]>;
  incrementPlatformClick(platform: string): Promise<void>;
  initializePlatforms(platforms: string[]): Promise<void>;
  
  // Google Reviews
  getGoogleReviews(): Promise<GoogleReview[]>;
  saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<GoogleReview[]>;
  clearGoogleReviews(): Promise<void>;
  
  // Verified Businesses (cache)
  getVerifiedBusiness(placeId: string): Promise<VerifiedBusiness | undefined>;
  saveVerifiedBusiness(business: InsertVerifiedBusiness): Promise<VerifiedBusiness>;
}

export class DatabaseStorage implements IStorage {
  async getStoreConfig(): Promise<StoreConfig | undefined> {
    const [config] = await db.select().from(storeConfig).limit(1);
    return config || undefined;
  }

  async updateStoreConfig(configData: InsertStoreConfig): Promise<StoreConfig> {
    // Check if config exists
    const existing = await this.getStoreConfig();
    
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
      // Create new config
      const [created] = await db
        .insert(storeConfig)
        .values(configData as any)
        .returning();
      return created;
    }
  }

  async addShopPhoto(photoBase64: string): Promise<StoreConfig> {
    const existing = await this.getStoreConfig();
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
        .values({ shopPhotos: newPhotos } as any)
        .returning();
      return created;
    }
  }

  async addSliderPhoto(photoBase64: string): Promise<StoreConfig> {
    const existing = await this.getStoreConfig();
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
        .values({ sliderPhotos: newPhotos } as any)
        .returning();
      return created;
    }
  }

  async setReviewHashtags(hashtags: string[]): Promise<StoreConfig> {
    const existing = await this.getStoreConfig();
    
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
        .values({ reviewHashtags: normalized } as any)
        .returning();
      return created;
    }
  }

  async getAllAnalytics(): Promise<Analytics[]> {
    return await db.select().from(analytics);
  }

  async incrementPlatformClick(platform: string): Promise<void> {
    // Upsert: increment if exists, create if not
    await db
      .insert(analytics)
      .values({ platform, clicks: 1 })
      .onConflictDoUpdate({
        target: analytics.platform,
        set: {
          clicks: sql`${analytics.clicks} + 1`,
          lastUpdated: new Date(),
        },
      });
  }

  async initializePlatforms(platforms: string[]): Promise<void> {
    // Initialize platforms with 0 clicks if they don't exist
    for (const platform of platforms) {
      await db
        .insert(analytics)
        .values({ platform, clicks: 0 })
        .onConflictDoNothing();
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
}

export const storage = new DatabaseStorage();
