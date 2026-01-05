# Tofako Control System

## Overview

Tofako Control is a full-stack management application for operational processes at Tofako company facilities. The system provides hierarchical menu navigation for controlling and monitoring various operational workflows including bio-waste tracking, sanitation schedules, temperature monitoring, shopping lists, and DPH (tax) reporting. The application is designed for use by facility workers, with PIN-based device authentication and facility-specific data isolation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom industrial/utility color palette
- **Build Tool**: Vite with Replit-specific plugins for development

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints with Zod validation for request/response schemas
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Static Data**: Menu structure loaded from JSON file (`server/menu_data.json`) for performance

### Data Layer
- **Primary Database**: PostgreSQL via Drizzle ORM (schema in `shared/schema.ts`)
- **Menu Storage**: Static JSON-based menu items with self-referential parent-child relationships
- **External Data**: Firebase Firestore for admin authentication, facilities configuration, and operational data (bio-waste, temperatures, sanitation records, shopping lists)

### Key Design Decisions
1. **Hybrid Storage**: PostgreSQL for relational menu structure, Firebase Firestore for facility-specific operational data
2. **Device Authentication**: PIN-based auth stored in localStorage, verified against Firebase admin code
3. **Performance Optimization**: All CSS animations removed to support older devices; framer-motion uninstalled
4. **Facility Isolation**: Each facility's data stored in separate Firestore collections/documents

### Project Structure
```
client/src/          # React frontend
  pages/             # Route components (Dashboard, BioWaste, Temperatures, etc.)
  components/        # Reusable UI components
  hooks/             # Custom React hooks
server/              # Express backend
  routes.ts          # API endpoint definitions
  firebase.ts        # Firestore integration
  storage.ts         # Menu data storage layer
shared/              # Shared types and schemas
  schema.ts          # Drizzle database schema
  routes.ts          # API route contracts with Zod
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries

### Firebase Services
- **Firebase Firestore**: Document database for operational data
- **Configuration**: `google-services.json` contains project credentials
- **Collections**: Global (adminCode), facilities, shopping lists, bio-waste, temperatures, sanitation records

### Third-Party APIs
- **FTP (basic-ftp)**: Used for Excel file uploads in DPH reporting
- **XLSX**: Excel file generation for reports

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- Firebase credentials are embedded in `google-services.json` and `server/firebase.ts`

### Deployment
- **Vercel**: Production deployment configured via `vercel.json`
- **API Routes**: Serverless functions in `api/` directory for Vercel