// Server component - purely presentational without client-only framer motion

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlareCard } from "@/components/ui/glare-card"
import {
  Search,
  Map,
  Download,
  Shield,
  Users,
  Database,
  ArrowRight,
  ChevronRight,
  Globe2,
  FileText,
  Zap
} from "lucide-react"
import Link from "next/link"

export function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "Advanced Search",
      description:
        "Powerful search capabilities with intelligent filters to find the exact geospatial datasets you need.",
      background:
        "bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600",
      pattern: "dots",
      accentColor: "blue"
    },
    {
      icon: Map,
      title: "Interactive Maps",
      description:
        "Visualize and explore geospatial data with our advanced mapping tools and spatial analysis features.",
      background: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
      pattern: "grid",
      accentColor: "emerald"
    },
    {
      icon: Database,
      title: "Rich Metadata",
      description:
        "Comprehensive metadata standards ensuring data quality, interoperability, and discoverability.",
      background:
        "bg-gradient-to-br from-violet-500 via-purple-500 to-pink-600",
      pattern: "waves",
      accentColor: "violet"
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "Connect with Nigeria's geospatial community and collaborate on data sharing initiatives.",
      background: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600",
      pattern: "circles",
      accentColor: "orange"
    },
    {
      icon: Shield,
      title: "Secure Access",
      description:
        "Enterprise-grade security with role-based access control and data governance frameworks.",
      background: "bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-700",
      pattern: "hexagon",
      accentColor: "slate"
    },
    {
      icon: Zap,
      title: "API Integration",
      description:
        "Seamlessly integrate with existing systems through our comprehensive REST and OGC APIs.",
      background:
        "bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600",
      pattern: "lightning",
      accentColor: "indigo"
    }
  ]

  // Additional detailed capabilities have been consolidated into the main
  // feature descriptions above to avoid duplicate card lists.

  const getPatternSVG = (pattern: string, accentColor: string) => {
    const patterns = {
      dots: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="2" fill="white" opacity="0.3"/><circle cx="5" cy="5" r="1" fill="white" opacity="0.2"/><circle cx="35" cy="35" r="1" fill="white" opacity="0.2"/><circle cx="5" cy="35" r="1" fill="white" opacity="0.2"/><circle cx="35" cy="5" r="1" fill="white" opacity="0.2"/></svg>`,
      grid: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1" opacity="0.2"/><path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="white" stroke-width="0.5" opacity="0.1"/></svg>`,
      waves: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M0 20 Q10 10 20 20 T40 20 V40 H0 Z" fill="white" opacity="0.1"/><path d="M0 30 Q10 25 20 30 T40 30" fill="none" stroke="white" stroke-width="1" opacity="0.2"/></svg>`,
      circles: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15" fill="none" stroke="white" stroke-width="1" opacity="0.2"/><circle cx="20" cy="20" r="8" fill="none" stroke="white" stroke-width="1" opacity="0.3"/></svg>`,
      hexagon: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><polygon points="20,5 30,12.5 30,27.5 20,35 10,27.5 10,12.5" fill="none" stroke="white" stroke-width="1" opacity="0.2"/><polygon points="20,10 25,13.75 25,26.25 20,30 15,26.25 15,13.75" fill="white" opacity="0.1"/></svg>`,
      lightning: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 5 L25 5 L18 20 L22 20 L12 35 L18 20 L15 20 Z" fill="white" opacity="0.2"/><path d="M8 15 L12 15 M28 25 L32 25 M5 25 L8 25 M32 15 L35 15" stroke="white" stroke-width="1" opacity="0.3"/></svg>`
    }
    return patterns[pattern as keyof typeof patterns] || patterns.dots
  }

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <div>
            <Badge
              variant="outline"
              className="mb-4 text-blue-600 border-blue-200"
            >
              Platform Features
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Comprehensive Geospatial Data Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover, access, and manage Nigeria's geospatial resources
              through our advanced platform designed for researchers, government
              agencies, and organizations.
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 justify-items-center">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const patternSVG = getPatternSVG(
              feature.pattern,
              feature.accentColor
            )
            const patternDataURL = `data:image/svg+xml,${encodeURIComponent(patternSVG)}`

            return (
              <div key={index}>
                <GlareCard className="relative overflow-hidden group">
                  {/* Background with Gradient and Pattern */}
                  <div
                    className={`absolute inset-0 z-0 ${feature.background}`}
                    style={{
                      backgroundImage: `url("${patternDataURL}")`,
                      backgroundSize: "40px 40px",
                      backgroundRepeat: "repeat"
                    }}
                  >
                    {/* Animated geometric overlay */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse delay-500" />
                    </div>

                    {/* Radial overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/10 to-black/30" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-center mb-6">
                      <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm border border-white/30 shadow-lg">
                        <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    <div className="text-center space-y-4">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {feature.title}
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed drop-shadow-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </GlareCard>
              </div>
            )
          })}
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}
