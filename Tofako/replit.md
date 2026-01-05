# Tofako Control System

## Overview

Tofako Control is a full-stack management application for operational processes at Tofako company facilities. The system provides a hierarchical menu navigation for controlling and monitoring various facility operations including temperature checks, sanitation schedules, documentation, and shopping lists. Built as a mobile-first web application with Slovak language interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom industrial/utility color palette
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)

### Data Layer
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - defines menu_items table with self-referential parent-child relationships
- **External Data**: Firebase Firestore for admin authentication, facilities, and shopping lists

### Animations & Performance
- **Optimized for Old Devices**: All CSS animations (animate-spin, animate-pulse), transitions, and hover effects have been removed to minimize CPU/GPU load.
- **Library Removal**: `framer-motion` has been uninstalled to reduce bundle size and memory usage.
- **UI State**: Interactive elements use solid state changes instead of animated transitions for immediate responsiveness.

## Export & Import (ZIP) Instructions

To export and move this project to another environment:

1. **Download as ZIP**: Use the Replit "Download as ZIP" feature.
2. **Environment Setup**:
   - Ensure Node.js 20+ is installed.
   - Run `npm install` to install dependencies.
   - Run `npx drizzle-kit push` to synchronize the local PostgreSQL database schema.
3. **Environment Variables**:
   - Re-configure the required secrets: `DATABASE_URL`, `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`.
4. **Running the App**:
   - Development: `npm run dev`
   - Production: `npm run build` followed by `npm start`

## Render Deployment Instructions

This project is configured for Render deployment:

1. **Push to GitHub**:
   - Export project to GitHub repository
   - Make sure all files are committed

2. **Create Web Service on Render**:
   - Go to Render Dashboard > New > Web Service
   - Connect your GitHub repository
   - Select the repository with Tofako project

3. **Configuration** (set in Render dashboard):
   - **Build Command**: `npm install && npm run build && npm run db:push`
   - **Start Command**: `npm start`
   - **Node Version**: 20.x (auto-detected from package.json)

4. **Environment Variables** (set in Render Environment tab):
   - `DATABASE_URL` - PostgreSQL connection string (use Render PostgreSQL or Neon)
   - `FIREBASE_API_KEY` - Firebase API key
   - `FIREBASE_PROJECT_ID` - Firebase project ID
   - `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
   - `NODE_ENV` - set to `production`

5. **How it works**:
   - Frontend: Built with Vite, served as static files from `dist/public`
   - Backend: Express.js server bundled with esbuild
   - Database: PostgreSQL with Drizzle ORM

**Note**: render.yaml is included for automatic configuration if you use "Blueprint" deployment.

## Vercel Deployment Instructions

This project is also configured for Vercel deployment:

1. **Import to Vercel**:
   - Connect your GitHub/GitLab repository or use Vercel CLI
   - Import the project to Vercel

2. **Environment Variables** (set in Vercel dashboard):
   - `DATABASE_URL` - PostgreSQL connection string (use Neon or similar)
   - `FIREBASE_API_KEY` - Firebase API key
   - `FIREBASE_PROJECT_ID` - Firebase project ID
   - `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket

3. **Configuration**:
   - Build command: `npm run vercel-build` (auto-detected from vercel.json)
   - Output directory: `dist/public` (auto-detected)
   - API routes: Located in `/api/index.ts` as serverless function

4. **How it works**:
   - Frontend: Built with Vite, served as static files from `dist/public`
   - Backend API: Runs as Vercel serverless function at `/api/*`
   - All API routes are handled by single serverless function for simplicity

### Build System
- **Development**: Vite dev server with HMR proxied through Express
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Database Migrations**: Drizzle Kit with `db:push` command

## External Dependencies

### Firebase Integration
- **Purpose**: Admin code verification, facility management, shopping list storage
- **Services Used**: Firestore for document storage
- **Configuration**: Environment variables for API keys and project settings
- **Data Structure**:
  - `Global/adminCode` - Admin authentication codes
  - `Global/appTimerMinutes` - Application session timer
  - `Prevadzky/` - Facility definitions
  - `NakupneZoznamy/` - Shopping list data per facility

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `FIREBASE_API_KEY` - Firebase API key (optional, disables Firebase features if missing)
- `FIREBASE_PROJECT_ID` - Firebase project identifier
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod resolver
- **Date Handling**: date-fns
- **HTTP Client**: Native fetch API wrapped in TanStack Query

## Recent Updates (December 31, 2025)

### Bug Fixes & Features
1. **Firebase Configuration**
   - Added environment variables for FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET
   - Firebase Firestore integration now fully operational

2. **Quarterly Sanitation (Kvartálna sanitácia)**
   - Added missing GET endpoint `/api/sanitation/:facilityId` to retrieve quarterly sanitation history
   - Endpoint properly fetches data from Firebase Firestore

3. **Temperature Logging (Teploty)**
   - Implemented period-aware temperature tracking: distinct MORNING and EVENING readings per fridge/date
   - Fixed race condition in batch temperature saves using Firestore atomic writes
   - Auto-fill buttons ("Ranné t. auto", "Večerné t. auto") now correctly save all refrigerators simultaneously
   - Temperature history updates automatically after saving (no page refresh needed)
   - Calendar date picker now closes automatically after selection
   - Existing temperature entries are replaced (not duplicated) when same date/fridge/period is saved

### Technical Implementation Details
- **Temperature Deduplication**: Matches by date (YYYY-MM-DD), fridge number, and period (morning/evening)
- **Auto-fill Mechanism**: Uses Promise.allSettled() to ensure all refrigerators process even if some fail
- **UI Responsiveness**: Implements direct history refetch after auto-fill saves
- **Calendar UX**: Popover state-controlled to auto-close on date selection

### Files Modified
- `server/routes.ts` - Added GET /api/sanitation/:facilityId endpoint
- `server/firebase.ts` - Enhanced saveTemperature() with deduplication logic and atomic writes
- `client/src/pages/TeplotyPage.tsx` - Improved auto-fill, calendar handling, and history refresh
- Configuration files - Firebase environment variables integrated

### Known Considerations
- All temperature data stored in Firebase Firestore (facility collection, Teploty document)
- Quarterly sanitation data stored in same Firestore structure
- PostgreSQL database maintains menu hierarchy via Drizzle ORM