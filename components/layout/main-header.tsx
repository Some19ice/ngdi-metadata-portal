"use client"

import GlobalSearchBar from "@/components/search/global-search-bar"
import NavigationLinks from "./navigation-links"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { AuthStateHandler } from "@/components/auth"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
// import Link from "next/link"; // Not strictly needed if no brand link in header

/**
 * Enhanced Unified Header Component that includes both banner and navigation sections
 * - Banner: Contains the NGDI logo and branding with enhanced gradients
 * - Header: Contains navigation, search, and user controls with modern styling
 */
export default function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Always start with `false` on the server to avoid hydration mismatches.
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // ----- Handle scroll detection for header styling (throttled) -----
  const handleScroll = useCallback(() => {
    const next = window.scrollY > 0
    // Only update state when value actually changes to avoid extra renders
    setIsScrolled(prev => (prev === next ? prev : next))
  }, [])

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Run once on mount in case we load the page already scrolled
    onScroll()

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [handleScroll])

  // Close mobile menu when clicking outside and manage body scroll
  const previousOverflow = useRef<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        !(event.target as Element).closest("[data-mobile-menu]")
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside)

      // Preserve existing overflow style so we can restore it later
      previousOverflow.current = document.body.style.overflow
      document.body.style.overflow = "hidden"
    } else {
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current
        previousOverflow.current = null
      }
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)

      // Ensure overflow is always restored on unmount
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current
        previousOverflow.current = null
      }
    }
  }, [isMenuOpen])

  return (
    <div className="sticky top-0 z-50 flex flex-col px-4 pt-4">
      {/* ===== ENHANCED BANNER SECTION ===== */}
      <div
        className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 h-[var(--banner-height)] flex items-center text-white overflow-hidden border border-white/10 rounded-t-2xl"
        role="banner"
        aria-label="NGDI Portal Banner"
      >
        {/* Animated background layers */}
        <div className="absolute inset-0">
          {/* Base gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-green-900/40"></div>

          {/* Animated gradient orbs */}
          <div className="absolute -top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -top-20 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "50px 50px"
            }}
          ></div>
        </div>

        {/* Banner content */}
        <div className="container mx-auto flex items-center justify-center px-4 relative z-10">
          <Link
            href="/"
            className="group flex items-center transition-all duration-300 ease-out hover:scale-[1.02]"
            aria-label="NGDI Portal - Go to homepage"
          >
            <div className="relative">
              <Image
                src="/img/logo.png"
                alt="NGDI Portal Logo"
                width={600}
                height={40}
                className="mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_4px_16px_rgba(59,130,246,0.3)] transition-all duration-300"
                priority
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-400/30 to-green-500/0 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </div>
          </Link>
        </div>

        {/* Bottom accent line with gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      </div>

      {/* ===== ENHANCED NAVIGATION HEADER ===== */}
      <header
        className={cn(
          "w-full h-[var(--header-height)] border-x border-b border-border/40 rounded-b-2xl transition-all duration-300 ease-in-out",
          isScrolled
            ? "bg-background/80 shadow-lg shadow-black/5 backdrop-blur-md border-border/60"
            : "bg-background/95 backdrop-blur-sm"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto flex h-full items-center justify-between space-x-4 px-4 sm:justify-between sm:space-x-0">
          {/* Desktop Navigation Links - Centered */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="relative">
              <NavigationLinks />
              {/* Subtle underline effect */}
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center justify-end space-x-3 md:flex-1 md:justify-end">
            <div className="relative">
              <GlobalSearchBar />
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <ThemeSwitcher />
              </div>

              <div className="relative">
                <AuthStateHandler />
              </div>
            </div>

            {/* Enhanced Mobile Menu Toggle */}
            <div className="md:hidden" data-mobile-menu>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                aria-label={
                  isMenuOpen ? "Close navigation menu" : "Open navigation menu"
                }
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                className={cn(
                  "relative overflow-hidden transition-all duration-200 hover:bg-accent/80 hover:scale-105",
                  isMenuOpen && "bg-accent text-accent-foreground"
                )}
                data-mobile-menu
              >
                <div className="relative z-10">
                  {isMenuOpen ? (
                    <X className="size-5 transition-transform duration-200 rotate-90" />
                  ) : (
                    <Menu className="size-5 transition-transform duration-200" />
                  )}
                </div>
                {/* Ripple effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation Menu */}
        {isMenuOpen && (
          <div
            className={cn(
              "border-t border-border/60 md:hidden shadow-xl backdrop-blur-md transition-all duration-300 ease-in-out",
              "bg-gradient-to-b from-background/95 to-background/90"
            )}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            data-mobile-menu
          >
            <nav className="container mx-auto flex flex-col space-y-1 p-6">
              <div className="space-y-3">
                <NavigationLinks />
              </div>

              {/* Mobile menu bottom accent */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-1 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30 rounded-full"></div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  )
}
