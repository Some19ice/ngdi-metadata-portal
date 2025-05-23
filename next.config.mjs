/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "*.tile.openstreetmap.org" },
      { hostname: "*.basemaps.cartocdn.com" },
      { hostname: "server.arcgisonline.com" },
      { hostname: "unpkg.com" },
      { hostname: "*.maptiler.com" },
      { hostname: "services.arcgis.com" },
      { hostname: "*.arcgisonline.com" },
      { hostname: "*.arcgis.com" },
      { hostname: "ows.terrestris.de" },
      { hostname: "demo.pygeoapi.io" },
      { hostname: "*.nationalmap.gov" }
    ]
  },
  webpack: (config, { isServer }) => {
    // Add support for Leaflet marker images (used by standard marker icon)
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg)$/i,
      type: "asset/resource"
    })

    // Only apply client-side optimizations
    if (!isServer) {
      // Ensure single instance of map libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        "maplibre-gl": "maplibre-gl",
        leaflet: "leaflet"
      }
    }

    return config
  },

  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "maplibre-gl",
      "leaflet",
      "react-leaflet",
      "xml2js"
    ]
  }
}

export default nextConfig
