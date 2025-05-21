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
      { hostname: "unpkg.com" }
    ]
  },
  webpack: config => {
    // Add support for Leaflet marker images (used by standard marker icon)
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg)$/i,
      type: "asset/resource"
    })
    return config
  }
}

export default nextConfig
