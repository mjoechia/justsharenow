# ShareLor - Review Sharing Platform

## Overview

ShareLor is a multi-view interactive web application designed to help businesses manage and deploy review-sharing campaigns through QR codes. The platform enables customers to select AI-generated reviews and photos, then share them across multiple social media platforms (Google, Facebook, Instagram, XiaoHongShu). Business owners can track QR code scan analytics, optimize campaigns based on performance data, and download print-ready marketing materials.

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
- `store_config` table: Single-row configuration storing social media URLs, website URL, shop photos (JSONB array), and review hashtags (text array)
- `analytics` table: Platform-specific click tracking with unique platform identifiers and click counts

**Recent Features:**
- AI-powered hashtag discovery: When scanning website, AI suggests up to 12 relevant hashtags
- Admin hashtag management: Approve/dismiss AI suggestions, add custom hashtags manually
- Customer hashtag selection: Hashtags displayed as selectable chips in review drafting flow
- ShareLor logo featured as default image in Shop Photos section

**Key Architectural Patterns:**
- Storage abstraction layer (`IStorage` interface) for database operations
- Separation of concerns: routes, storage, database connection, and static serving
- Environment-based configuration (DATABASE_URL from environment variables)
- Request/response logging with timestamp formatting

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