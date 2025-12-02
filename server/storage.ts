import { 
  storeConfig, 
  analytics,
  type StoreConfig, 
  type InsertStoreConfig,
  type Analytics,
  type InsertAnalytics 
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Store Configuration
  getStoreConfig(): Promise<StoreConfig | undefined>;
  updateStoreConfig(config: InsertStoreConfig): Promise<StoreConfig>;
  addShopPhoto(photoBase64: string): Promise<StoreConfig>;
  
  // Analytics
  getAllAnalytics(): Promise<Analytics[]>;
  incrementPlatformClick(platform: string): Promise<void>;
  initializePlatforms(platforms: string[]): Promise<void>;
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
      // Only update shopPhotos field, preserve everything else
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
      // Create new config with just the photo
      const [created] = await db
        .insert(storeConfig)
        .values({ shopPhotos: newPhotos } as any)
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
}

export const storage = new DatabaseStorage();
