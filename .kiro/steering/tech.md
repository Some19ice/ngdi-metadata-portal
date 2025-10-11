# Technology Stack

## Core Framework

- **Next.js 15**: React framework with App Router for server-side rendering and routing
- **TypeScript**: Type-safe JavaScript with strict mode enabled
- **React 18**: UI library with concurrent features

## Frontend

- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Shadcn UI**: Component library built on Radix UI primitives
- **Framer Motion**: Animation library for smooth interactions
- **Lucide React**: Icon library

## Backend & Database

- **PostgreSQL**: Primary database
- **Drizzle ORM**: Type-safe SQL ORM with schema-first approach
- **Server Actions**: Next.js server-side data mutations
- **Zod**: Runtime type validation and schema validation

## Authentication & Authorization

- **Clerk**: Authentication service with role-based access control
- **Custom RBAC**: Role and permission system with organization-based access

## Mapping & GIS

- **Leaflet**: Interactive map library
- **MapLibre GL**: Vector tile rendering
- **React Leaflet**: React bindings for Leaflet
- **MapTiler**: Map tile service
- **Supercluster**: Point clustering for map markers

## External Services

- **Stripe**: Payment processing
- **PostHog**: Analytics and feature flags
- **Vercel**: Deployment platform

## Development Tools

- **ESLint**: Code linting with Next.js and Prettier configs
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **Lint-staged**: Run linters on staged files
- **Playwright**: End-to-end testing

## Common Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run clean        # Fix linting and format code
npm run type-check   # TypeScript type checking
```

### Database

```bash
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio
npm run db:push      # Push schema changes to database
npm run seed         # Seed database with initial data
```

### Code Quality

```bash
npm run format:write # Format code with Prettier
npm run format:check # Check code formatting
npm run typecheck    # Run TypeScript compiler checks
```

### Testing

```bash
npm run screenshots  # Take automated screenshots with Playwright
```

## Build System

- **Webpack**: Module bundler (configured via Next.js)
- **PostCSS**: CSS processing with Tailwind
- **SWC**: Fast TypeScript/JavaScript compiler (Next.js default)

## Environment Configuration

- Uses `.env.local` for local development
- Environment variables prefixed with `NEXT_PUBLIC_` for client-side access
- Separate configs for development, staging, and production
