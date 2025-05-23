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
- **GIS Services**: ArcGIS REST API, OGC WMS/WFS

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

## GIS Service Integration

The NGDI Metadata Portal supports integration with various GIS services:

### Supported Service Types

- **ArcGIS Services**: MapServer, FeatureServer, ImageServer, VectorTileServer
- **OGC Services**: WMS, WFS

### Using GIS Services

1. **Adding Services to the Map**: Use the GIS Services panel in the map view to add external services.
2. **Validating Service URLs**: The portal includes a service validator to check if a URL points to a valid GIS service.
3. **Metadata Integration**: When creating metadata records, you can validate and add GIS service endpoints in the GIS Services section.

### Example Service URLs

- ArcGIS MapServer: `https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/MapServer`
- WMS: `https://ows.terrestris.de/osm/service?SERVICE=WMS&REQUEST=GetCapabilities`
- WFS: `https://demo.pygeoapi.io/master?service=WFS&request=GetCapabilities`

### Accessing the GIS Services Demo

After starting the development server, visit [http://localhost:3000/map/gis-services](http://localhost:3000/map/gis-services) to explore the GIS services integration demo.

## Contributing

Contributions to the NGDI Metadata Portal are welcome. Please feel free to submit issues and pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
