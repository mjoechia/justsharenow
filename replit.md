# ShareLor - Review Sharing Platform

## Overview

ShareLor is a multi-view interactive web application designed to help businesses manage and deploy review-sharing campaigns through QR codes. The platform enables customers to select AI-generated reviews and photos, then share them across 6 social media platforms (Google Reviews, Facebook, Instagram, XiaoHongShu, TikTok, WhatsApp). Business owners can track QR code scan analytics, optimize campaigns based on performance data, and download print-ready marketing materials.

The application features a customer-facing flow for review selection and sharing, and an administrative dashboard for campaign management and analytics tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TailwindCSS v4 with custom design tokens for styling
- Framer Motion for animations and transitions
- shadcn/ui component library (Radix UI primitives) following the "new-york" style variant

**State Management:**
- Zustand with persistence middleware for global application state
- TanStack Query (React Query) for server state management and caching
- LocalStorage integration for persisting user selections and campaign data

**Key Design Decisions:**
- Component-based architecture with reusable UI components from shadcn/ui
- Separation of customer-facing pages (`/drafting`, `/platform`) and admin pages (`/admin`)
- Responsive design with mobile-first approach
- Multi-language support (English/Chinese) implemented through a translation system
- Custom CSS variables for theming with purple/indigo brand colors

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js for the HTTP server
- TypeScript with ES modules for type safety
- Drizzle ORM for database operations
- PostgreSQL (via Neon serverless) for data persistence
- WebSocket support (ws package) for Neon database connections

**API Design:**
- RESTful API endpoints under `/api` prefix
- JSON-based request/response format
- Express middleware for request logging and error handling
- Static file serving for production builds
- Vite middleware integration for development HMR

**Database Schema:**
- `users` table: User accounts with roles (master_admin, admin, user), approval status (pending, approved, rejected), authentication fields (passwordHash for master admin, googleId for OAuth), and profile info
- `admin_user_assignments` table: Many-to-many relationship mapping admins to their assigned users
- `sessions` table: PostgreSQL-backed session storage for connect-pg-simple
- `store_config` table: Per-user configuration storing 6 social media URLs (googleReviewsUrl, facebookUrl, instagramUrl, xiaohongshuUrl, tiktokUrl, whatsappUrl), Google Place ID (googlePlaceId), website URL, shop photos (JSONB array), slider photos (JSONB array), and review hashtags (text array). Now includes userId for multi-tenant isolation.
- `analytics` table: Platform-specific click tracking with unique platform identifiers (google-reviews, facebook, instagram, xiaohongshu, tiktok, whatsapp) and click counts. Scoped by placeId.
- `verified_businesses` table: Caches verified business data from Google Places API with 7-day cache duration. Stores placeId (unique), businessName, address, rating, totalReviews, website, googleMapsUrl, and verifiedAt timestamp

**Authentication System (3-Tier):**
- **Master Admin**: Username/password login (username: jc141319), password stored securely in MASTER_ADMIN_PASSWORD secret with bcrypt hashing. Full system control including user/admin management.
- **Admins**: Google OAuth via Replit Auth (OpenID Connect). Require master admin approval after first login. Can manage their assigned users and email QR codes.
- **Users**: Account created by master admin, each gets isolated store config. Access Shop View, Admin View, Quick View for their own data.
- Session management: connect-pg-simple with PostgreSQL storage, 7-day sessions
- Route protection: requireMasterAdmin, requireAdmin, requireApproved middleware enforce role-based access

**Recent Features:**
- 6-platform support: Google Reviews, Facebook, Instagram, XiaoHongShu, TikTok, WhatsApp
- Google Place ID integration: AI extracts Google Place ID from website to generate pre-filled review links
- Pre-filled Google Reviews: When Place ID is available, customers see a one-click review experience with their selected review text pre-populated in Google Reviews (format: https://search.google.com/local/writereview?placeid=PLACE_ID&review=ENCODED_TEXT)
- AI-powered social link discovery: Scans business website to auto-discover social media URLs for all 6 platforms and extract Google Place ID
- AI-powered hashtag discovery: When scanning website, AI suggests up to 12 relevant hashtags
- Admin hashtag management: Approve/dismiss AI suggestions, add custom hashtags manually
- Customer hashtag selection: Hashtags displayed as selectable chips in review drafting flow
- Dirty state tracking: "Save Changes" button only enabled when configuration is modified
- Dynamic platform filtering: Shop View only displays platforms that have configured URLs
- JustShareNow logo featured as default image in Shop Photos section

**Key Architectural Patterns:**
- Storage abstraction layer (`IStorage` interface) for database operations
- Separation of concerns: routes, storage, database connection, and static serving
- Environment-based configuration (DATABASE_URL from environment variables)
- Request/response logging with timestamp formatting

**Security: Multi-Tenant Isolation (December 2025):**
- All storage methods require explicit placeId or userId for tenant scoping
- No fallback to "first record" - operations without tenant identifier throw errors
- GET /api/config requires placeId parameter
- GET /api/analytics requires placeId + ownership verification via store_config lookup
- POST /api/analytics/track requires placeId + config existence verification
- GET/PUT /api/admin/my-config uses userId with role-based access control
- Admins can only access data for users assigned to them
- Master admin bypasses all tenant restrictions
- NaN/invalid userId parameters are rejected at route level

### Build and Deployment

**Build Process:**
- Separate build scripts for client (Vite) and server (esbuild)
- Server bundling with selective dependency externalization (allowlist for critical packages)
- Production-ready output in `dist/` directory
- Client assets compiled to `dist/public/`

**Development Workflow:**
- Concurrent development servers: Vite dev server on port 5000 for client, Express for backend
- Hot Module Replacement (HMR) via Vite
- TypeScript type checking across shared types
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)

## External Dependencies

### Database
- **Neon Serverless PostgreSQL**: Primary data store accessed via `@neondatabase/serverless` package with WebSocket connections
- **Drizzle ORM**: Type-safe database toolkit with schema-first approach
- Schema migrations stored in `./migrations` directory

### UI Component Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tooltip, etc.)
- **shadcn/ui**: Pre-built components following the new-york style variant
- **Lucide React**: Icon library for consistent iconography

### Analytics and Tracking
- QR code generation via `qrcode.react` package
- Platform click tracking stored in PostgreSQL analytics table
- AI-powered optimization recommendations (OpenAI integration prepared but optional)

### Third-Party Services (Configured but Optional)
- **OpenAI API**: For AI-generated review content and optimization suggestions
  - Configured via `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` environment variables
  - URL validation and security measures prevent SSRF attacks

### Development Tools
- **Replit-specific plugins**: Dev banner, cartographer, runtime error modal for Replit environment
- **Custom Vite plugin**: Meta image updater for OpenGraph and Twitter cards
- **Cheerio**: HTML parsing for external review URL analysis

### Styling and Animation
- **TailwindCSS v4**: Utility-first CSS framework with custom theme
- **Framer Motion**: Declarative animations for UI interactions
- **Embla Carousel**: Touch-friendly carousel component with autoplay support
- **class-variance-authority**: Type-safe variant management for components

### Session and State Management
- LocalStorage persistence for user selections and campaign data
- No session management currently implemented (architecture supports future authentication via passport/express-session packages in dependencies)