/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize hydration
  reactStrictMode: true,

  // Reduce hydration mismatches
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"]
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },

  // Better error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2
  },

  // Webpack optimizations
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

      // Optimize client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }

    return config
  }
}

export default nextConfig
