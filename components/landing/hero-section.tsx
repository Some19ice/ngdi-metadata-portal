"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ArrowRight, Search, Map, Globe2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Suspense, Component, ReactNode } from "react"
import Image from "next/image"
import LandingHeader from "@/components/layout/landing-header"
import { TrustBadges } from "@/components/landing/trust-badges"

// Fallback for globe loading/error states
function GlobeLoadingFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-green-900/20 animate-pulse rounded-full" />
  )
}

// Error boundary to catch any globe-related errors
interface GlobeSectionErrorBoundaryProps {
  children: ReactNode
}

interface GlobeSectionErrorBoundaryState {
  hasError: boolean
}

class GlobeSectionErrorBoundary extends Component<
  GlobeSectionErrorBoundaryProps,
  GlobeSectionErrorBoundaryState
> {
  constructor(props: GlobeSectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): GlobeSectionErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn("Globe section error:", error.message)
  }

  render() {
    if (this.state.hasError) {
      return <GlobeLoadingFallback />
    }
    return this.props.children
  }
}

// Dynamically import the globe component for better performance
const GlobeDemo = dynamic(() => import("@/components/hero-globe"), {
  ssr: false,
  loading: () => <GlobeLoadingFallback />
})

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Navigation Header */}
      <LandingHeader showSearchBar />

      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/img/hero-satellite-earth.webp"
          alt="Satellite view of Earth from space"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/40" />
      </div>

      {/* Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-40" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-50" />
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-30" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge
                variant="outline"
                className="mb-6 px-4 py-4 border-white/30 text-white bg-white/10 backdrop-blur-sm text-2xl"
              >
                <Globe2 className="w-4 h-4 mr-2" />
                National Geospatial Data Infrastructure
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Discover Nigeria's{" "}
              <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text">
                Geospatial Data
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              Access comprehensive geospatial metadata, explore interactive
              maps, and unlock insights for informed decision-making across
              Nigeria's diverse landscapes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start"
            >
              <Link href="/search">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold border-white/30 text-white bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Explore Datasets
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/map">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold border-white/30 text-white bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  <Map className="w-5 h-5 mr-2" />
                  View Interactive Map
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <TrustBadges />
          </motion.div>

          {/* Right Content - Globe Component */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 w-full max-w-2xl"
          >
            <div className="relative aspect-square w-full max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-full blur-3xl animate-pulse" />
              <GlobeSectionErrorBoundary>
                <Suspense fallback={<GlobeLoadingFallback />}>
                  <GlobeDemo />
                </Suspense>
              </GlobeSectionErrorBoundary>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center text-white/60">
          <span className="text-sm mb-2">Explore Features</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
