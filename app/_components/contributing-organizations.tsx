"use client"

import { SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { OrganizationCarousel } from "@/components/ui/organization-carousel"
import Link from "next/link"

// Type for public organizations display (subset of SelectOrganization)
type PublicOrganization = Pick<
  SelectOrganization,
  "id" | "name" | "logoUrl" | "websiteUrl" | "description"
>

interface ContributingOrganizationsProps {
  organizations: PublicOrganization[]
}

export function ContributingOrganizations({
  organizations
}: ContributingOrganizationsProps) {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Enhanced Background with Rich Gradient and Visible Patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-teal-400/15 via-cyan-400/15 to-blue-500/15 dark:from-emerald-700/25 dark:via-teal-600/25 dark:via-cyan-500/25 dark:to-blue-700/25">
        {/* Base layer with visible mesh pattern */}
        <div className="absolute inset-0 opacity-60">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="meshPattern"
                x="0"
                y="0"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 0,40 L 40,0 L 80,40 L 40,80 Z"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  opacity="0.6"
                />
                <circle cx="40" cy="40" r="3" fill="#10b981" opacity="0.7" />
                <circle cx="0" cy="40" r="1.5" fill="#0d9488" opacity="0.5" />
                <circle cx="80" cy="40" r="1.5" fill="#0d9488" opacity="0.5" />
                <circle cx="40" cy="0" r="1.5" fill="#0891b2" opacity="0.5" />
                <circle cx="40" cy="80" r="1.5" fill="#0891b2" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#meshPattern)" />
          </svg>
        </div>

        {/* Prominent Network Connection Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-50"
          viewBox="0 0 1000 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="networkPattern"
              x="0"
              y="0"
              width="200"
              height="150"
              patternUnits="userSpaceOnUse"
            >
              {/* Major connection nodes with solid colors */}
              <circle cx="50" cy="40" r="4" fill="#10b981" opacity="0.8" />
              <circle cx="150" cy="40" r="3.5" fill="#0d9488" opacity="0.7" />
              <circle cx="100" cy="110" r="3" fill="#0891b2" opacity="0.6" />
              <circle cx="30" cy="90" r="2.5" fill="#059669" opacity="0.5" />
              <circle cx="170" cy="95" r="2.5" fill="#0284c7" opacity="0.5" />

              {/* Secondary nodes */}
              <circle cx="80" cy="60" r="2" fill="#34d399" opacity="0.6" />
              <circle cx="120" cy="65" r="2" fill="#22d3ee" opacity="0.6" />
              <circle cx="70" cy="120" r="2" fill="#6ee7b7" opacity="0.5" />
              <circle cx="130" cy="115" r="2" fill="#67e8f9" opacity="0.5" />

              {/* Primary connections with visible strokes */}
              <line
                x1="50"
                y1="40"
                x2="150"
                y2="40"
                stroke="#10b981"
                strokeWidth="2"
                opacity="0.7"
              />
              <line
                x1="50"
                y1="40"
                x2="100"
                y2="110"
                stroke="#0d9488"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1="150"
                y1="40"
                x2="100"
                y2="110"
                stroke="#0891b2"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Secondary connections */}
              <line
                x1="50"
                y1="40"
                x2="80"
                y2="60"
                stroke="#34d399"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1="150"
                y1="40"
                x2="120"
                y2="65"
                stroke="#22d3ee"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1="100"
                y1="110"
                x2="70"
                y2="120"
                stroke="#6ee7b7"
                strokeWidth="1"
                opacity="0.4"
              />
              <line
                x1="100"
                y1="110"
                x2="130"
                y2="115"
                stroke="#67e8f9"
                strokeWidth="1"
                opacity="0.4"
              />

              {/* Branching connections */}
              <line
                x1="30"
                y1="90"
                x2="50"
                y2="40"
                stroke="#059669"
                strokeWidth="1"
                opacity="0.4"
              />
              <line
                x1="170"
                y1="95"
                x2="150"
                y2="40"
                stroke="#0284c7"
                strokeWidth="1"
                opacity="0.4"
              />
              <line
                x1="80"
                y1="60"
                x2="120"
                y2="65"
                stroke="#10b981"
                strokeWidth="0.8"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#networkPattern)" />
        </svg>

        {/* Simplified Geospatial Grid Overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40"
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="geoGrid"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              {/* Grid lines */}
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#10b981"
                strokeWidth="0.5"
                opacity="0.6"
              />
              {/* Coordinate markers */}
              <circle cx="0" cy="0" r="1" fill="#0d9488" opacity="0.7" />
              <circle cx="20" cy="20" r="0.5" fill="#0891b2" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geoGrid)" />
        </svg>

        {/* Enhanced floating geometric elements with more visibility */}
        <div className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-br from-emerald-400/40 to-teal-400/40 rounded-full blur-xl animate-float shadow-2xl shadow-emerald-400/30"></div>
        <div className="absolute top-32 right-24 w-24 h-24 bg-gradient-to-br from-cyan-400/40 to-blue-400/40 rounded-full blur-lg animate-pulse-soft shadow-xl shadow-cyan-400/30"></div>
        <div
          className="absolute bottom-24 left-1/4 w-36 h-36 bg-gradient-to-br from-teal-400/35 to-emerald-500/35 rounded-full blur-xl animate-float shadow-2xl shadow-teal-400/25"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-16 right-16 w-20 h-20 bg-gradient-to-br from-blue-400/40 to-cyan-500/40 rounded-full blur-md animate-pulse-soft shadow-lg shadow-blue-400/30"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-12 w-16 h-16 bg-gradient-to-br from-emerald-300/35 to-teal-300/35 rounded-full blur-sm animate-float shadow-lg shadow-emerald-300/20"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-28 h-28 bg-gradient-to-br from-cyan-300/35 to-blue-300/35 rounded-full blur-md animate-pulse-soft shadow-lg shadow-cyan-300/20"
          style={{ animationDelay: "1.5s" }}
        ></div>

        {/* More visible radial gradients for depth */}
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-gradient-radial from-emerald-400/15 via-emerald-400/5 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-radial from-cyan-400/15 via-cyan-400/5 to-transparent blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-radial from-teal-400/12 via-teal-400/4 to-transparent blur-3xl"></div>

        {/* Additional overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 dark:via-black/5 dark:to-black/10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            Contributing Organizations
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Meet the institutions and organizations driving Nigeria's geospatial
            data initiative forward
          </p>
        </div>

        {/* Use 21st dev magic component */}
        <OrganizationCarousel
          organizations={organizations}
          columns={3}
          className="mb-12"
        />

        <div className="text-center">
          <Link href="/organizations">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg font-semibold border-cyan-500/30 text-black bg-emerald-700/10 hover:bg-emerald-700/20 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/50"
            >
              View All Organizations
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
