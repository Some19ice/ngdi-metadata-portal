# NGDI Metadata Portal

The National Geospatial Data Infrastructure (NGDI) Metadata Portal is a comprehensive web-based platform for the discovery, access, management, and visualization of geospatial metadata and data.

## Overview

The NGDI Metadata Portal serves as a centralized hub for Nigeria's geospatial data infrastructure, enabling government agencies, organizations, and the public to discover, access, and contribute to the nation's geospatial data resources. The platform facilitates metadata management, data discovery, and collaboration among stakeholders in the geospatial community.

## Key Features

- **Metadata Management**: Create, edit, and manage metadata records following international standards
- **Advanced Search**: Discover geospatial data through text, spatial, and faceted search capabilities
- **User Management**: Comprehensive user roles and permissions system
- **Organization Management**: Support for multiple organizations with dedicated node officers
- **Admin Dashboard**: System monitoring, user management, and configuration tools
- **Interactive Map Viewer**: Visualize and interact with geospatial data
- **API Access**: Programmatic access to metadata and data services

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/docs), [Tailwind CSS](https://tailwindcss.com/docs/guides/nextjs), [Shadcn UI](https://ui.shadcn.com/docs/installation)
- **Backend**: [PostgreSQL](https://www.postgresql.org/about/), [Drizzle ORM](https://orm.drizzle.team/docs/get-started-postgresql), [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- **Authentication**: [Clerk](https://clerk.com/)
- **Analytics**: [PostHog](https://posthog.com/)
- **Mapping**: [Leaflet](https://leafletjs.com/), [MapLibre](https://maplibre.org/)

## Environment Variables

```bash
# Database
DATABASE_URL=

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Setup

1. Clone the repository

   ```bash
   git clone https://github.com/Some19ice/ngdi-metadata-portal.git
   cd ngdi-metadata-portal
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Copy the environment variables file and configure it

   ```bash
   cp .env.example .env.local
   ```

4. Set up the database

   ```bash
   npm run db:push
   ```

5. Start the development server

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contributing

Contributions to the NGDI Metadata Portal are welcome. Please feel free to submit issues and pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
