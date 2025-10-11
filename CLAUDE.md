# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The NGDI Metadata Portal is a comprehensive web platform for Nigeria's National Geospatial Data Infrastructure. It manages geospatial metadata discovery, access, and collaboration among government agencies and organizations.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: PostgreSQL, Drizzle ORM, Next.js Server Actions
- **Authentication**: Clerk
- **Analytics**: PostHog
- **Maps**: Leaflet, MapLibre GL, ArcGIS REST API, OGC WMS/WFS
- **Payments**: Stripe
- **Deployment**: Vercel

## Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run type-check            # TypeScript type checking
npm run format:write          # Format code with Prettier
npm run format:check          # Check code formatting
npm run clean                 # Run lint:fix and format:write

# Database
npm run db:studio             # Open Drizzle Studio (database GUI)
npm run db:generate           # Generate migrations (DO NOT USE - handled automatically)
npm run db:migrate            # Run migrations (DO NOT USE - use db:push)
npm run db:push               # Push schema changes to database
npm run seed                  # Seed users and roles

# Analysis & Testing
npm run analyze               # Analyze bundle size
npm run screenshots           # Take screenshots with Playwright
```

## Architecture

### Project Structure

```
├── actions/               # Server actions (data mutations)
│   ├── db/               # Database-related actions
│   └── *-actions.ts      # Other server actions (auth, notifications, etc.)
├── app/                  # Next.js App Router
│   ├── (app)/           # Main authenticated routes
│   ├── (admin)/         # Admin-only routes
│   ├── (node-officer)/  # Node officer routes
│   ├── (auth)/          # Authentication routes
│   ├── api/             # API routes
│   └── map/             # Map viewer routes
├── components/           # Shared React components
│   ├── ui/              # Shadcn UI components
│   └── utilities/       # Utility components
├── contexts/            # React contexts (map, organization)
├── db/                  # Database layer
│   ├── schema/         # Drizzle schema definitions
│   └── db.ts           # Database connection
├── lib/                 # Utility functions and helpers
│   ├── gis-services/   # GIS service integrations
│   ├── hooks/          # Custom React hooks
│   ├── validators/     # Validation logic
│   └── rbac.ts         # Role-based access control
└── types/               # TypeScript type definitions
```

### Role-Based Access Control (RBAC)

The portal implements a sophisticated two-tier RBAC system:

**Global Roles** (defined in `lib/rbac.ts`):

- System Administrator: Full system access
- Node Officer: Organization management within assigned orgs
- Metadata Creator: Create and edit metadata
- Metadata Approver: Review and approve metadata

**Organization-Specific Roles** (in `userOrganizationsTable`):

- Node Officer: Manages users within an organization
- Metadata Creator: Creates metadata for the organization
- Metadata Approver: Approves metadata for the organization

**Key RBAC Functions**:

- `getUserRoles(userId)`: Get all global roles for a user
- `requiresRole(roles[])`: Check if user has required global role
- `hasPermission(userId, action, subject)`: Check specific permission
- `isNodeOfficerForOrg(userId, orgId)`: Check org-specific role
- `hasOrgRole(userId, orgId, role)`: Check any org role

### Database Schema

Core tables:

- `metadata_records`: Geospatial metadata following NGDI standards
- `organizations`: Government agencies and institutions
- `users`: User profiles (synced with Clerk)
- `roles` + `permissions` + `rolePermissions`: RBAC system
- `userRoles`: Global role assignments
- `userOrganizationsTable`: Organization memberships and roles
- `audit_logs`: System activity tracking
- `notifications`: User notifications

**Metadata Schema**: The `metadata_records` table follows international geospatial standards with extensive JSONB fields:

- `locationInfo`: Geographic location details (state, LGA, zone)
- `spatialInfo`: Coordinate systems, projections, spatial representation
- `temporalInfo`: Date ranges and temporal extent
- `distributionInfo`: Access methods, download URLs, licensing
- `dataQualityInfo`: Quality reports and accuracy information
- `processingInfo`: Processing steps and lineage
- `fundamentalDatasetsInfo`: Fundamental dataset classifications

### Authentication & Middleware

The `middleware.ts` handles:

1. **Rate limiting** (using Redis if available, in-memory fallback):
   - API routes: configurable per endpoint type
   - Search/metadata APIs: separate limits
   - Auth endpoints: strict limits
2. **Route protection**: Public routes defined in `isPublicRoute` matcher
3. **Pathname forwarding**: For layout-based routing decisions

### Map Architecture

**GIS Service Integration** (`lib/gis-services/`):

- `service-factory.ts`: Factory for creating service instances
- `arcgis-service.ts`: ArcGIS REST API integration (MapServer, FeatureServer, etc.)
- `ogc-service.ts`: OGC services (WMS, WFS)
- `geocoding-service.ts`: Geocoding functionality

**Map Performance** (`lib/map-*.ts`):

- `map-config.ts`: Centralized map configuration
- `map-clustering.ts`: Marker clustering with Supercluster
- `map-performance.ts`: Performance optimization utilities
- `map-loader.ts`: Lazy loading for map components

**Map Security** (`lib/map-security.ts`):

- URL validation for external services
- Content Security Policy helpers
- XSS prevention for map data

### Search Architecture

Multiple search implementations optimized for different contexts:

- `app/api/search/`: Main search API with faceting
- `lib/search/facets.ts`: Faceted search logic
- `lib/hooks/use-unified-search.ts`: Unified search hook
- `lib/hooks/use-debounced-search.ts`: Debounced search
- `lib/cache.ts`: Search result caching

## Coding Standards

### File Naming

- Use kebab-case for all files: `example-component.tsx`
- Schema files: `*-schema.ts` (e.g., `metadata-records-schema.ts`)
- Action files: `*-actions.ts` (e.g., `metadata-records-actions.ts`)
- Type files: `*-types.ts` in `types/` directory

### Server Components

- Tag with `"use server"` at the top
- Use Suspense for async data fetching
- Await params: `const { id } = await params`
- Never import into client components (use children prop)

Example:

```tsx
"use server"

import { Suspense } from "react"

export default async function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DataFetcher />
    </Suspense>
  )
}

async function DataFetcher() {
  const { data } = await fetchData()
  return <ClientComponent initialData={data} />
}
```

### Client Components

- Tag with `"use client"` at the top
- Never define server actions inline (create in `/actions`)
- Use hooks for interactivity

### Server Actions

- Always return `Promise<ActionState<T>>`
- Name with `Action` suffix: `createMetadataAction`
- DB actions go in `actions/db/`
- Sort in CRUD order (Create, Read, Update, Delete)
- Use `auth()` from `@clerk/nextjs/server` for authentication

```ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }
```

### Database Schemas

- Export schema in `db/schema/index.ts`
- Add to schema object in `db/db.ts`
- Always include `createdAt` and `updatedAt` timestamps
- Use `userId: text("user_id").notNull()` for user references
- Cascade deletes where appropriate
- Use enums for limited value sets

```ts
export const exampleTable = pgTable("example", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  // ... other fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertExample = typeof exampleTable.$inferInsert
export type SelectExample = typeof exampleTable.$inferSelect
```

### Imports

- Use `@/` for all imports from project root
- Types: `@/types`
- Actions: `@/actions` or `@/actions/db`
- Schema: `@/db/schema`
- Components: `@/components`

### Environment Variables

- Store in `.env.local` (never commit)
- Update `.env.example` when adding new vars
- Use `NEXT_PUBLIC_` prefix for client-accessible vars
- Never expose secrets to frontend

### Database Workflow

- **NEVER** run `db:generate` or `db:migrate` manually
- Use `npm run db:push` to sync schema changes
- Drizzle Kit handles migrations folder automatically
- Ignore `db/migrations/` folder entirely

### Map Components

When working with map features:

- Lazy load map components (they're client-side heavy)
- Use clustering for large marker sets
- Validate external service URLs (`lib/map-security.ts`)
- Check `map-config.ts` for centralized settings
- Use provided GIS service abstractions

### Metadata Records

When handling metadata:

- Follow NGDI standards defined in schema
- Use provided validators (`lib/validators/metadata-validator.ts`)
- Respect metadata workflow (Draft → Pending → Approved → Published)
- Check RBAC before mutations (creator, approver, admin)

### Testing

- Run existing tests before commits
- Use Playwright for screenshots (`npm run screenshots`)
- Test with both authenticated and public routes

## Common Patterns

### Protected Pages

```tsx
"use server"

import { auth } from "@clerk/nextjs/server"
import { requiresRole } from "@/lib/rbac"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const { isAllowed } = await requiresRole(["System Administrator"])

  if (!isAllowed) {
    redirect("/unauthorized")
  }

  return <AdminDashboard />
}
```

### Organization-Scoped Actions

```tsx
"use server"

import { auth } from "@clerk/nextjs/server"
import { isNodeOfficerForOrg } from "@/lib/rbac"

export async function updateOrgAction(orgId: string, data: any) {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: "Unauthorized" }

  const isOfficer = await isNodeOfficerForOrg(userId, orgId)
  if (!isOfficer) return { isSuccess: false, message: "Forbidden" }

  // Proceed with update
}
```

### Working with JSONB Fields

```tsx
// When updating metadata with nested JSONB fields
const spatialInfo: SpatialInfo = {
  coordinateSystem: "WGS 84",
  projection: "UTM Zone 32N",
  boundingBox: {
    westBoundingCoordinate: 2.668,
    eastBoundingCoordinate: 14.678,
    northBoundingCoordinate: 13.892,
    southBoundingCoordinate: 4.277
  }
}

await updateMetadataAction(id, { spatialInfo })
```

## Important Notes

- The portal uses Clerk for authentication but stores user metadata in local `users` table
- Rate limiting is optional but recommended (requires Redis or uses in-memory fallback)
- Public routes include `/metadata/*` and `/api/search/*` for discovery
- Map components are client-side only and should be lazy loaded
- All metadata changes are logged in `metadata_change_logs` table
- Organization memberships are many-to-many (users can belong to multiple orgs with different roles)
