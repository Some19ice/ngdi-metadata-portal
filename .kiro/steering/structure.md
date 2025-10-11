# Project Structure

## Root Directory Organization

### Core Application

- `app/` - Next.js App Router pages and layouts
- `components/` - Shared React components
- `lib/` - Utility functions, hooks, and configurations
- `types/` - TypeScript type definitions
- `actions/` - Server actions for data mutations

### Data Layer

- `db/` - Database schema, migrations, and configuration
- `contexts/` - React context providers

### Configuration & Tooling

- `docs/` - Project documentation and specifications
- `scripts/` - Database seeding and utility scripts
- `public/` - Static assets and files
- `.kiro/` - Kiro AI assistant steering rules
- `.cursor/` - Cursor IDE configuration and rules

## App Directory Structure (Next.js App Router)

### Route Groups

- `app/(admin)/` - Admin dashboard routes with shared layout
- `app/(app)/` - Main application routes (metadata, search, etc.)
- `app/(auth)/` - Authentication routes (login, signup)
- `app/(node-officer)/` - Node officer specific routes

### API Routes

- `app/api/` - REST API endpoints
  - `clerk-user/` - User management endpoints
  - `metadata/` - Metadata CRUD operations
  - `search/` - Search functionality
  - `map/` - Map-related services

### Page Structure Convention

- `page.tsx` - Route page component
- `layout.tsx` - Shared layout for route group
- `_components/` - Route-specific components (private)

## Components Organization

### UI Components

- `components/ui/` - Base UI components (buttons, forms, etc.)
- `components/utilities/` - Utility components (providers, error boundaries)

### Feature Components

- `components/auth/` - Authentication-related components
- `components/search/` - Search functionality components
- `components/metadata/` - Metadata management components
- `components/sidebar/` - Navigation and sidebar components

### Naming Convention

- Use kebab-case for all files and folders
- Component files end with `.tsx`
- Use descriptive names that indicate purpose

## Database Structure

### Schema Organization

- `db/schema/` - Drizzle ORM schema definitions
- `db/migrations/` - Auto-generated database migrations
- Each schema file follows pattern: `{feature}-schema.ts`

### Key Schema Files

- `metadata-records-schema.ts` - Core metadata entities
- `organizations-schema.ts` - Organization management
- `users-schema.ts` - User profiles and authentication
- `roles-schema.ts` - Role-based access control
- `audit-logs-schema.ts` - System audit trails

## Actions Structure

### Server Actions Organization

- `actions/db/` - Database-related server actions
- `actions/` - Other server actions (external APIs, etc.)

### Naming Convention

- Files: `{feature}-actions.ts`
- Functions: `{operation}{Entity}Action` (e.g., `createMetadataRecordAction`)
- Return type: `Promise<ActionState<T>>`

## Library Structure

### Hooks

- `lib/hooks/` - Custom React hooks
- `hooks/` - Additional hooks (legacy location)

### Utilities

- `lib/utils/` - General utility functions
- `lib/validators/` - Zod validation schemas
- `lib/search/` - Search-related utilities

### GIS Services

- `lib/gis-services/` - GIS service integrations
- `lib/map-*.ts` - Map-related utilities and configurations

## Import Path Conventions

### Absolute Imports

- `@/` - Root directory alias
- `@/components` - Shared components
- `@/lib` - Library utilities
- `@/db/schema` - Database schemas
- `@/actions` - Server actions
- `@/types` - Type definitions

### Special Hooks Path

- `@/hooks/*` - Maps to `lib/hooks/*` for consistency

## File Naming Conventions

### General Rules

- Use kebab-case for all files and directories
- TypeScript files use `.ts` extension
- React components use `.tsx` extension
- Configuration files may use their conventional names

### Component Files

- Components: `feature-component.tsx`
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Types: `feature-types.ts`
- Actions: `feature-actions.ts`
- Schemas: `feature-schema.ts`

## Configuration Files Location

### Root Level

- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `drizzle.config.ts` - Database ORM configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

### Environment Files

- `.env.local` - Local development environment variables
- `.env.example` - Template for required environment variables
