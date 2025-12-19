CREATE TABLE "admin_user_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text,
	"platform" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"author_photo_url" text,
	"rating" integer NOT NULL,
	"text" text,
	"relative_time" text,
	"publish_time" timestamp,
	"google_review_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_user_id" integer NOT NULL,
	"target_user_id" integer NOT NULL,
	"action" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"place_id" text,
	"business_name" text,
	"website_url" text,
	"google_reviews_url" text,
	"google_place_id" text,
	"facebook_url" text,
	"instagram_url" text,
	"xiaohongshu_url" text,
	"tiktok_url" text,
	"whatsapp_url" text,
	"shop_photos" jsonb DEFAULT '[]'::jsonb,
	"slider_photos" jsonb DEFAULT '[]'::jsonb,
	"review_hashtags" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_config_place_id_unique" UNIQUE("place_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"platform" text NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"photo_url" text,
	"language" text DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"username" text,
	"password_hash" text,
	"google_id" text,
	"display_name" text,
	"avatar_url" text,
	"slug" text,
	"recent_user_ids" jsonb DEFAULT '[]'::jsonb,
	"role" text DEFAULT 'user' NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "verified_businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"business_name" text,
	"address" text,
	"rating" real,
	"total_reviews" integer DEFAULT 0,
	"website" text,
	"google_maps_url" text,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verified_businesses_place_id_unique" UNIQUE("place_id")
);
