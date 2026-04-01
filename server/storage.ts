import { pool, SCHEMA } from "./db";
import type {
  StoreConfig, InsertStoreConfig,
  Analytics, InsertAnalytics,
  GoogleReview, InsertGoogleReview,
  VerifiedBusiness, InsertVerifiedBusiness,
  Testimonial, InsertTestimonial,
  User, InsertUser,
  AdminUserAssignment, InsertAdminUserAssignment,
  UserRole, ApprovalStatus,
  PasswordEvent, InsertPasswordEvent,
  SystemSetting,
} from "@shared/schema";
import { DEFAULT_SESSION_TIMEOUT_MINUTES } from "@shared/schema";

const S = SCHEMA;

// ─── Row mappers (snake_case DB → camelCase TS) ───────────────────────────────

function mapUser(r: any): User {
  return {
    id: r.id,
    email: r.email,
    username: r.username,
    passwordHash: r.password_hash,
    googleId: r.google_id,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    slug: r.slug,
    recentUserIds: r.recent_user_ids ?? [],
    role: r.role,
    approvalStatus: r.approval_status,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    isActive: r.is_active,
    isDemo: r.is_demo,
    accountType: r.account_type,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapStoreConfig(r: any): StoreConfig {
  return {
    id: r.id,
    userId: r.user_id,
    placeId: r.place_id,
    businessName: r.business_name,
    businessNameZh: r.business_name_zh,
    websiteUrl: r.website_url,
    googleReviewsUrl: r.google_reviews_url,
    googlePlaceId: r.google_place_id,
    facebookUrl: r.facebook_url,
    instagramUrl: r.instagram_url,
    xiaohongshuUrl: r.xiaohongshu_url,
    tiktokUrl: r.tiktok_url,
    whatsappUrl: r.whatsapp_url,
    shopPhotos: r.shop_photos ?? [],
    sliderPhotos: r.slider_photos ?? [],
    reviewHashtags: r.review_hashtags ?? [],
    companyLogo: r.company_logo,
    hideJustShareNowLogo: r.hide_justsharenow_logo ?? false,
    updatedAt: r.updated_at,
  };
}

function mapAnalytics(r: any): Analytics {
  return {
    id: r.id,
    placeId: r.place_id,
    platform: r.platform,
    clicks: r.clicks,
    lastUpdated: r.last_updated,
  };
}

function mapTestimonial(r: any): Testimonial {
  return {
    id: r.id,
    placeId: r.place_id,
    platform: r.platform,
    rating: r.rating,
    reviewText: r.review_text,
    photoUrl: r.photo_url,
    language: r.language,
    createdAt: r.created_at,
  };
}

function mapGoogleReview(r: any): GoogleReview {
  return {
    id: r.id,
    authorName: r.author_name,
    authorPhotoUrl: r.author_photo_url,
    rating: r.rating,
    text: r.text,
    relativeTime: r.relative_time,
    publishTime: r.publish_time,
    googleReviewId: r.google_review_id,
    createdAt: r.created_at,
  };
}

function mapVerifiedBusiness(r: any): VerifiedBusiness {
  return {
    id: r.id,
    placeId: r.place_id,
    businessName: r.business_name,
    address: r.address,
    rating: r.rating,
    totalReviews: r.total_reviews,
    website: r.website,
    googleMapsUrl: r.google_maps_url,
    verifiedAt: r.verified_at,
  };
}

function mapPasswordEvent(r: any): PasswordEvent {
  return {
    id: r.id,
    actorUserId: r.actor_user_id,
    targetUserId: r.target_user_id,
    action: r.action,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    createdAt: r.created_at,
  };
}

function mapSystemSetting(r: any): SystemSetting {
  return {
    id: r.id,
    key: r.key,
    value: r.value,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  };
}

function mapAssignment(r: any): AdminUserAssignment {
  return {
    id: r.id,
    adminId: r.admin_id,
    userId: r.user_id,
    assignedAt: r.assigned_at,
    assignedBy: r.assigned_by,
  };
}

// ─── Storage interface ────────────────────────────────────────────────────────

export interface IStorage {
  getStoreConfig(placeId?: string): Promise<StoreConfig | undefined>;
  updateStoreConfig(config: InsertStoreConfig, placeId?: string): Promise<StoreConfig>;
  addShopPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig>;
  addSliderPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig>;
  addShopPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig>;
  addSliderPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig>;
  removeSliderPhotoByUserId(userId: number, photoIndex: number): Promise<StoreConfig>;
  setReviewHashtags(hashtags: string[], placeId?: string): Promise<StoreConfig>;
  getAllBusinesses(): Promise<StoreConfig[]>;

  getAllAnalytics(placeId?: string): Promise<Analytics[]>;
  getAnalyticsByPlaceId(placeId: string): Promise<Analytics[]>;
  incrementPlatformClick(platform: string, placeId: string): Promise<void>;
  initializePlatforms(platforms: string[], placeId: string): Promise<void>;

  getGoogleReviews(): Promise<GoogleReview[]>;
  saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<GoogleReview[]>;
  clearGoogleReviews(): Promise<void>;

  getVerifiedBusiness(placeId: string): Promise<VerifiedBusiness | undefined>;
  saveVerifiedBusiness(business: InsertVerifiedBusiness): Promise<VerifiedBusiness>;

  getTestimonials(placeId: string): Promise<Testimonial[]>;
  saveTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;

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

  assignUserToAdmin(adminId: number, userId: number, assignedBy: number): Promise<AdminUserAssignment>;
  removeUserFromAdmin(adminId: number, userId: number): Promise<void>;
  getUsersForAdmin(adminId: number): Promise<User[]>;
  getAdminForUser(userId: number): Promise<User | undefined>;
  getAssignmentsForAdmin(adminId: number): Promise<AdminUserAssignment[]>;

  getStoreConfigByUserId(userId: number): Promise<StoreConfig | undefined>;
  getStoreConfigByPlaceId(placeId: string): Promise<StoreConfig | undefined>;
  createStoreConfigForUser(userId: number): Promise<StoreConfig>;
  updateStoreConfigByUserId(userId: number, configData: InsertStoreConfig): Promise<StoreConfig>;

  logPasswordEvent(event: InsertPasswordEvent): Promise<PasswordEvent>;
  getPasswordEvents(targetUserId?: number): Promise<PasswordEvent[]>;

  getActiveAdmins(): Promise<User[]>;
  addRecentUser(adminId: number, userId: number): Promise<void>;

  getSystemSetting(key: string): Promise<string | undefined>;
  setSystemSetting(key: string, value: string, updatedBy?: number): Promise<SystemSetting>;
  getSessionTimeoutMinutes(): Promise<number>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // ── Store Config ────────────────────────────────────────────────────────────

  async getStoreConfig(placeId?: string): Promise<StoreConfig | undefined> {
    if (!placeId) throw new Error("placeId is required for getStoreConfig");
    return this.getStoreConfigByPlaceId(placeId);
  }

  async getStoreConfigByPlaceId(placeId: string): Promise<StoreConfig | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.store_config WHERE place_id = $1 LIMIT 1`, [placeId]
    );
    return rows[0] ? mapStoreConfig(rows[0]) : undefined;
  }

  async getStoreConfigByUserId(userId: number): Promise<StoreConfig | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.store_config WHERE user_id = $1 LIMIT 1`, [userId]
    );
    return rows[0] ? mapStoreConfig(rows[0]) : undefined;
  }

  async createStoreConfigForUser(userId: number): Promise<StoreConfig> {
    const { rows } = await pool.query(
      `INSERT INTO ${S}.store_config (user_id) VALUES ($1) RETURNING *`, [userId]
    );
    return mapStoreConfig(rows[0]);
  }

  async getAllBusinesses(): Promise<StoreConfig[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.store_config WHERE place_id IS NOT NULL`
    );
    return rows.map(mapStoreConfig);
  }

  async updateStoreConfig(configData: InsertStoreConfig, placeId?: string): Promise<StoreConfig> {
    const targetPlaceId = placeId || configData.placeId;
    if (!targetPlaceId) throw new Error("placeId is required for updateStoreConfig");
    const existing = await this.getStoreConfigByPlaceId(targetPlaceId);
    if (existing) {
      return this._updateStoreConfigById(existing.id, configData);
    }
    const { rows } = await pool.query(
      `INSERT INTO ${S}.store_config (place_id, user_id, business_name, business_name_zh,
        website_url, google_reviews_url, google_place_id, facebook_url, instagram_url,
        xiaohongshu_url, tiktok_url, whatsapp_url, shop_photos, slider_photos,
        review_hashtags, company_logo, hide_justsharenow_logo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        targetPlaceId, configData.userId ?? null, configData.businessName ?? null,
        configData.businessNameZh ?? null, configData.websiteUrl ?? null,
        configData.googleReviewsUrl ?? null, configData.googlePlaceId ?? null,
        configData.facebookUrl ?? null, configData.instagramUrl ?? null,
        configData.xiaohongshuUrl ?? null, configData.tiktokUrl ?? null,
        configData.whatsappUrl ?? null,
        JSON.stringify(configData.shopPhotos ?? []),
        JSON.stringify(configData.sliderPhotos ?? []),
        JSON.stringify(configData.reviewHashtags ?? []),
        configData.companyLogo ?? null, configData.hideJustShareNowLogo ?? false,
      ]
    );
    return mapStoreConfig(rows[0]);
  }

  async updateStoreConfigByUserId(userId: number, configData: InsertStoreConfig): Promise<StoreConfig> {
    const existing = await this.getStoreConfigByUserId(userId);
    if (existing) {
      const { placeId: _p, userId: _u, ...safeData } = configData as any;
      return this._updateStoreConfigById(existing.id, safeData);
    }
    const { rows } = await pool.query(
      `INSERT INTO ${S}.store_config (user_id, place_id, business_name, business_name_zh,
        website_url, google_reviews_url, google_place_id, facebook_url, instagram_url,
        xiaohongshu_url, tiktok_url, whatsapp_url, shop_photos, slider_photos,
        review_hashtags, company_logo, hide_justsharenow_logo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        userId, configData.placeId ?? null, configData.businessName ?? null,
        configData.businessNameZh ?? null, configData.websiteUrl ?? null,
        configData.googleReviewsUrl ?? null, configData.googlePlaceId ?? null,
        configData.facebookUrl ?? null, configData.instagramUrl ?? null,
        configData.xiaohongshuUrl ?? null, configData.tiktokUrl ?? null,
        configData.whatsappUrl ?? null,
        JSON.stringify(configData.shopPhotos ?? []),
        JSON.stringify(configData.sliderPhotos ?? []),
        JSON.stringify(configData.reviewHashtags ?? []),
        configData.companyLogo ?? null, configData.hideJustShareNowLogo ?? false,
      ]
    );
    return mapStoreConfig(rows[0]);
  }

  private async _updateStoreConfigById(id: number, data: Partial<InsertStoreConfig>): Promise<StoreConfig> {
    const { rows } = await pool.query(
      `UPDATE ${S}.store_config SET
        business_name = COALESCE($2, business_name),
        business_name_zh = COALESCE($3, business_name_zh),
        website_url = COALESCE($4, website_url),
        google_reviews_url = COALESCE($5, google_reviews_url),
        google_place_id = COALESCE($6, google_place_id),
        facebook_url = COALESCE($7, facebook_url),
        instagram_url = COALESCE($8, instagram_url),
        xiaohongshu_url = COALESCE($9, xiaohongshu_url),
        tiktok_url = COALESCE($10, tiktok_url),
        whatsapp_url = COALESCE($11, whatsapp_url),
        shop_photos = COALESCE($12, shop_photos),
        slider_photos = COALESCE($13, slider_photos),
        review_hashtags = COALESCE($14, review_hashtags),
        company_logo = COALESCE($15, company_logo),
        hide_justsharenow_logo = COALESCE($16, hide_justsharenow_logo),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        id,
        data.businessName ?? null, data.businessNameZh ?? null,
        data.websiteUrl ?? null, data.googleReviewsUrl ?? null,
        data.googlePlaceId ?? null, data.facebookUrl ?? null,
        data.instagramUrl ?? null, data.xiaohongshuUrl ?? null,
        data.tiktokUrl ?? null, data.whatsappUrl ?? null,
        data.shopPhotos !== undefined ? JSON.stringify(data.shopPhotos) : null,
        data.sliderPhotos !== undefined ? JSON.stringify(data.sliderPhotos) : null,
        data.reviewHashtags !== undefined ? JSON.stringify(data.reviewHashtags) : null,
        data.companyLogo ?? null, data.hideJustShareNowLogo ?? null,
      ]
    );
    return mapStoreConfig(rows[0]);
  }

  async addShopPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig> {
    if (!placeId) throw new Error("placeId is required for addShopPhoto");
    const existing = await this.getStoreConfigByPlaceId(placeId);
    const currentPhotos = existing?.shopPhotos ?? [];
    if (currentPhotos.length >= 9) throw new Error("Maximum of 9 photos allowed");
    const newPhotos = [...currentPhotos, photoBase64];
    if (existing) {
      const { rows } = await pool.query(
        `UPDATE ${S}.store_config SET shop_photos = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [existing.id, JSON.stringify(newPhotos)]
      );
      return mapStoreConfig(rows[0]);
    }
    const { rows } = await pool.query(
      `INSERT INTO ${S}.store_config (place_id, shop_photos) VALUES ($1, $2) RETURNING *`,
      [placeId, JSON.stringify(newPhotos)]
    );
    return mapStoreConfig(rows[0]);
  }

  async addSliderPhoto(photoBase64: string, placeId?: string): Promise<StoreConfig> {
    if (!placeId) throw new Error("placeId is required for addSliderPhoto");
    const existing = await this.getStoreConfigByPlaceId(placeId);
    const currentPhotos = existing?.sliderPhotos ?? [];
    if (currentPhotos.length >= 3) throw new Error("Maximum of 3 slider photos allowed");
    const newPhotos = [...currentPhotos, photoBase64];
    if (existing) {
      const { rows } = await pool.query(
        `UPDATE ${S}.store_config SET slider_photos = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [existing.id, JSON.stringify(newPhotos)]
      );
      return mapStoreConfig(rows[0]);
    }
    const { rows } = await pool.query(
      `INSERT INTO ${S}.store_config (place_id, slider_photos) VALUES ($1, $2) RETURNING *`,
      [placeId, JSON.stringify(newPhotos)]
    );
    return mapStoreConfig(rows[0]);
  }

  async addShopPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig> {
    let existing = await this.getStoreConfigByUserId(userId);
    if (!existing) existing = await this.createStoreConfigForUser(userId);
    const currentPhotos = existing.shopPhotos ?? [];
    if (currentPhotos.length >= 9) throw new Error("Maximum of 9 shop photos allowed");
    const newPhotos = [...currentPhotos, photoBase64];
    const { rows } = await pool.query(
      `UPDATE ${S}.store_config SET shop_photos = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [existing.id, JSON.stringify(newPhotos)]
    );
    return mapStoreConfig(rows[0]);
  }

  async addSliderPhotoByUserId(userId: number, photoBase64: string): Promise<StoreConfig> {
    let existing = await this.getStoreConfigByUserId(userId);
    if (!existing) existing = await this.createStoreConfigForUser(userId);
    const currentPhotos = existing.sliderPhotos ?? [];
    if (currentPhotos.length >= 3) throw new Error("Maximum of 3 slider photos allowed");
    const newPhotos = [...currentPhotos, photoBase64];
    const { rows } = await pool.query(
      `UPDATE ${S}.store_config SET slider_photos = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [existing.id, JSON.stringify(newPhotos)]
    );
    return mapStoreConfig(rows[0]);
  }

  async removeSliderPhotoByUserId(userId: number, photoIndex: number): Promise<StoreConfig> {
    const existing = await this.getStoreConfigByUserId(userId);
    if (!existing) throw new Error("Config not found for user");
    const currentPhotos = existing.sliderPhotos ?? [];
    if (photoIndex < 0 || photoIndex >= currentPhotos.length) throw new Error("Invalid photo index");
    const newPhotos = currentPhotos.filter((_, i) => i !== photoIndex);
    const { rows } = await pool.query(
      `UPDATE ${S}.store_config SET slider_photos = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [existing.id, JSON.stringify(newPhotos)]
    );
    return mapStoreConfig(rows[0]);
  }

  async setReviewHashtags(hashtags: string[], placeId?: string): Promise<StoreConfig> {
    if (!placeId) throw new Error("placeId is required for setReviewHashtags");
    const withPrefix = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).slice(0, 12);
    const normalized = Array.from(new Set(withPrefix));
    const existing = await this.getStoreConfigByPlaceId(placeId);
    if (existing) {
      const { rows } = await pool.query(
        `UPDATE ${S}.store_config SET review_hashtags = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [existing.id, JSON.stringify(normalized)]
      );
      return mapStoreConfig(rows[0]);
    }
    const { rows } = await pool.query(
      `INSERT INTO ${S}.store_config (place_id, review_hashtags) VALUES ($1, $2) RETURNING *`,
      [placeId, JSON.stringify(normalized)]
    );
    return mapStoreConfig(rows[0]);
  }

  // ── Analytics ───────────────────────────────────────────────────────────────

  async getAllAnalytics(placeId?: string): Promise<Analytics[]> {
    if (!placeId) throw new Error("placeId is required for getAllAnalytics");
    return this.getAnalyticsByPlaceId(placeId);
  }

  async getAnalyticsByPlaceId(placeId: string): Promise<Analytics[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.analytics WHERE place_id = $1`, [placeId]
    );
    return rows.map(mapAnalytics);
  }

  async incrementPlatformClick(platform: string, placeId: string): Promise<void> {
    const { rows } = await pool.query(
      `SELECT id FROM ${S}.analytics WHERE platform = $1 AND place_id = $2 LIMIT 1`,
      [platform, placeId]
    );
    if (rows.length > 0) {
      await pool.query(
        `UPDATE ${S}.analytics SET clicks = clicks + 1, last_updated = NOW() WHERE id = $1`,
        [rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO ${S}.analytics (platform, place_id, clicks) VALUES ($1, $2, 1)`,
        [platform, placeId]
      );
    }
  }

  async initializePlatforms(platforms: string[], placeId: string): Promise<void> {
    for (const platform of platforms) {
      await pool.query(
        `INSERT INTO ${S}.analytics (platform, place_id, clicks)
         VALUES ($1, $2, 0)
         ON CONFLICT DO NOTHING`,
        [platform, placeId]
      );
    }
  }

  // ── Google Reviews ──────────────────────────────────────────────────────────

  async getGoogleReviews(): Promise<GoogleReview[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.google_reviews ORDER BY rating`
    );
    return rows.map(mapGoogleReview);
  }

  async saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<GoogleReview[]> {
    if (reviews.length === 0) return [];
    await this.clearGoogleReviews();
    const results: GoogleReview[] = [];
    for (const r of reviews) {
      const { rows } = await pool.query(
        `INSERT INTO ${S}.google_reviews
          (author_name, author_photo_url, rating, text, relative_time, publish_time, google_review_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [r.authorName, r.authorPhotoUrl ?? null, r.rating, r.text ?? null,
         r.relativeTime ?? null, r.publishTime ?? null, r.googleReviewId ?? null]
      );
      results.push(mapGoogleReview(rows[0]));
    }
    return results;
  }

  async clearGoogleReviews(): Promise<void> {
    await pool.query(`DELETE FROM ${S}.google_reviews`);
  }

  // ── Verified Businesses ─────────────────────────────────────────────────────

  async getVerifiedBusiness(placeId: string): Promise<VerifiedBusiness | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.verified_businesses WHERE place_id = $1 LIMIT 1`, [placeId]
    );
    return rows[0] ? mapVerifiedBusiness(rows[0]) : undefined;
  }

  async saveVerifiedBusiness(business: InsertVerifiedBusiness): Promise<VerifiedBusiness> {
    const { rows } = await pool.query(
      `INSERT INTO ${S}.verified_businesses
        (place_id, business_name, address, rating, total_reviews, website, google_maps_url, verified_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())
       ON CONFLICT (place_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        address = EXCLUDED.address,
        rating = EXCLUDED.rating,
        total_reviews = EXCLUDED.total_reviews,
        website = EXCLUDED.website,
        google_maps_url = EXCLUDED.google_maps_url,
        verified_at = NOW()
       RETURNING *`,
      [business.placeId, business.businessName ?? null, business.address ?? null,
       business.rating ?? null, business.totalReviews ?? null,
       business.website ?? null, business.googleMapsUrl ?? null]
    );
    return mapVerifiedBusiness(rows[0]);
  }

  // ── Testimonials ────────────────────────────────────────────────────────────

  async getTestimonials(placeId: string): Promise<Testimonial[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.testimonials WHERE place_id = $1 ORDER BY created_at DESC`, [placeId]
    );
    return rows.map(mapTestimonial);
  }

  async saveTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const { rows } = await pool.query(
      `INSERT INTO ${S}.testimonials (place_id, platform, rating, review_text, photo_url, language)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [testimonial.placeId, testimonial.platform, testimonial.rating,
       testimonial.reviewText ?? null, testimonial.photoUrl ?? null, testimonial.language ?? 'en']
    );
    return mapTestimonial(rows[0]);
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  async getUserById(id: number): Promise<User | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE id = $1 LIMIT 1`, [id]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE username = $1 LIMIT 1`, [username]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE email = $1 LIMIT 1`, [email]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE google_id = $1 LIMIT 1`, [googleId]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async getUserBySlug(slug: string): Promise<User | undefined> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE slug = $1 LIMIT 1`, [slug]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { rows } = await pool.query(
      `INSERT INTO ${S}.users
        (email, username, password_hash, google_id, display_name, avatar_url, slug,
         recent_user_ids, role, approval_status, approved_by, approved_at,
         is_active, is_demo, account_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        user.email ?? null, user.username ?? null, user.passwordHash ?? null,
        user.googleId ?? null, user.displayName ?? null, user.avatarUrl ?? null,
        user.slug ?? null, JSON.stringify(user.recentUserIds ?? []),
        user.role ?? 'user', user.approvalStatus ?? 'pending',
        user.approvedBy ?? null, user.approvedAt ?? null,
        user.isActive ?? true, user.isDemo ?? false, user.accountType ?? 'customer',
      ]
    );
    return mapUser(rows[0]);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [id];
    let i = 2;

    const map: Record<string, string> = {
      email: 'email', username: 'username', passwordHash: 'password_hash',
      googleId: 'google_id', displayName: 'display_name', avatarUrl: 'avatar_url',
      slug: 'slug', role: 'role', approvalStatus: 'approval_status',
      approvedBy: 'approved_by', approvedAt: 'approved_at',
      isActive: 'is_active', isDemo: 'is_demo', accountType: 'account_type',
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in updates) {
        fields.push(`${col} = $${i++}`);
        values.push((updates as any)[key]);
      }
    }

    if (updates.recentUserIds !== undefined) {
      fields.push(`recent_user_ids = $${i++}`);
      values.push(JSON.stringify(updates.recentUserIds));
    }

    fields.push('updated_at = NOW()');

    const { rows } = await pool.query(
      `UPDATE ${S}.users SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return mapUser(rows[0]);
  }

  async deleteUser(id: number): Promise<void> {
    await pool.query(
      `DELETE FROM ${S}.admin_user_assignments WHERE admin_id = $1 OR user_id = $1`, [id]
    );
    await pool.query(`DELETE FROM ${S}.users WHERE id = $1`, [id]);
  }

  async getAllUsers(): Promise<User[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users ORDER BY created_at DESC`
    );
    return rows.map(mapUser);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE role = $1 ORDER BY created_at DESC`, [role]
    );
    return rows.map(mapUser);
  }

  async getPendingApprovals(): Promise<User[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users WHERE approval_status = 'pending' ORDER BY created_at`
    );
    return rows.map(mapUser);
  }

  async approveUser(userId: number, approvedBy: number): Promise<User> {
    const { rows } = await pool.query(
      `UPDATE ${S}.users SET approval_status = 'approved', approved_by = $2,
        approved_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [userId, approvedBy]
    );
    return mapUser(rows[0]);
  }

  async rejectUser(userId: number): Promise<User> {
    const { rows } = await pool.query(
      `UPDATE ${S}.users SET approval_status = 'rejected', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [userId]
    );
    return mapUser(rows[0]);
  }

  async updatePassword(userId: number, passwordHash: string): Promise<User> {
    const { rows } = await pool.query(
      `UPDATE ${S}.users SET password_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [userId, passwordHash]
    );
    return mapUser(rows[0]);
  }

  // ── Admin-User Assignments ──────────────────────────────────────────────────

  async assignUserToAdmin(adminId: number, userId: number, assignedBy: number): Promise<AdminUserAssignment> {
    await pool.query(
      `DELETE FROM ${S}.admin_user_assignments WHERE user_id = $1`, [userId]
    );
    const { rows } = await pool.query(
      `INSERT INTO ${S}.admin_user_assignments (admin_id, user_id, assigned_by)
       VALUES ($1,$2,$3) RETURNING *`,
      [adminId, userId, assignedBy]
    );
    return mapAssignment(rows[0]);
  }

  async removeUserFromAdmin(adminId: number, userId: number): Promise<void> {
    await pool.query(
      `DELETE FROM ${S}.admin_user_assignments WHERE admin_id = $1 AND user_id = $2`,
      [adminId, userId]
    );
  }

  async getUsersForAdmin(adminId: number): Promise<User[]> {
    console.log(`[getUsersForAdmin] adminId=${adminId}`);
    const { rows } = await pool.query(
      `SELECT u.* FROM ${S}.users u
       JOIN ${S}.admin_user_assignments a ON a.user_id = u.id
       WHERE a.admin_id = $1`,
      [adminId]
    );
    console.log(`[getUsersForAdmin] Found ${rows.length} users`);
    return rows.map(mapUser);
  }

  async getAdminForUser(userId: number): Promise<User | undefined> {
    const { rows } = await pool.query(
      `SELECT u.* FROM ${S}.users u
       JOIN ${S}.admin_user_assignments a ON a.admin_id = u.id
       WHERE a.user_id = $1 LIMIT 1`,
      [userId]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async getAssignmentsForAdmin(adminId: number): Promise<AdminUserAssignment[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.admin_user_assignments WHERE admin_id = $1`, [adminId]
    );
    return rows.map(mapAssignment);
  }

  // ── Password Events ─────────────────────────────────────────────────────────

  async logPasswordEvent(event: InsertPasswordEvent): Promise<PasswordEvent> {
    const { rows } = await pool.query(
      `INSERT INTO ${S}.password_events (actor_user_id, target_user_id, action, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [event.actorUserId, event.targetUserId, event.action,
       event.ipAddress ?? null, event.userAgent ?? null]
    );
    return mapPasswordEvent(rows[0]);
  }

  async getPasswordEvents(targetUserId?: number): Promise<PasswordEvent[]> {
    if (targetUserId) {
      const { rows } = await pool.query(
        `SELECT * FROM ${S}.password_events WHERE target_user_id = $1 ORDER BY created_at DESC`,
        [targetUserId]
      );
      return rows.map(mapPasswordEvent);
    }
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.password_events ORDER BY created_at DESC`
    );
    return rows.map(mapPasswordEvent);
  }

  // ── Active Admins + Recent Users ────────────────────────────────────────────

  async getActiveAdmins(): Promise<User[]> {
    const { rows } = await pool.query(
      `SELECT * FROM ${S}.users
       WHERE role = 'admin' AND is_active = TRUE AND approval_status = 'approved'`
    );
    return rows.map(mapUser);
  }

  async addRecentUser(adminId: number, userId: number): Promise<void> {
    const admin = await this.getUserById(adminId);
    if (!admin) return;
    const current = (admin.recentUserIds as number[]) ?? [];
    const updated = [userId, ...current.filter(id => id !== userId)].slice(0, 3);
    await pool.query(
      `UPDATE ${S}.users SET recent_user_ids = $2 WHERE id = $1`,
      [adminId, JSON.stringify(updated)]
    );
  }

  // ── System Settings ─────────────────────────────────────────────────────────

  async getSystemSetting(key: string): Promise<string | undefined> {
    const { rows } = await pool.query(
      `SELECT value FROM ${S}.system_settings WHERE key = $1 LIMIT 1`, [key]
    );
    return rows[0]?.value;
  }

  async setSystemSetting(key: string, value: string, updatedBy?: number): Promise<SystemSetting> {
    const { rows } = await pool.query(
      `INSERT INTO ${S}.system_settings (key, value, updated_by)
       VALUES ($1,$2,$3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING *`,
      [key, value, updatedBy ?? null]
    );
    return mapSystemSetting(rows[0]);
  }

  async getSessionTimeoutMinutes(): Promise<number> {
    const value = await this.getSystemSetting('session_timeout_minutes');
    if (value) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }
}

export const storage = new DatabaseStorage();
