"use client"

import Link from "next/link"
import { Globe2 } from "lucide-react"
import GlobalSearchBar from "@/components/search/global-search-bar"

interface LandingHeaderProps {
  showSearchBar?: boolean
}

export default function LandingHeader({
  showSearchBar = false
}: LandingHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-white font-bold text-xl flex items-center space-x-2"
            >
              <Globe2 className="w-8 h-8" />
              <span>NGDI Metadata Portal</span>
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-white/90 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/search"
                className="text-white/90 hover:text-white transition-colors"
              >
                Search
              </Link>
              <Link
                href="/map"
                className="text-white/90 hover:text-white transition-colors"
              >
                Map
              </Link>
              <Link
                href="/about"
                className="text-white/90 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/committee"
                className="text-white/90 hover:text-white transition-colors"
              >
                Committee
              </Link>
              <Link
                href="/publications"
                className="text-white/90 hover:text-white transition-colors"
              >
                Publications
              </Link>
              <Link
                href="/news"
                className="text-white/90 hover:text-white transition-colors"
              >
                News
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {showSearchBar && (
              <div className="hidden lg:block w-72 mr-6">
                <GlobalSearchBar />
              </div>
            )}

            <Link
              href="/login"
              className="text-white/90 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
