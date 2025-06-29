"use client"

import GlobalSearchBar from "@/components/search/global-search-bar"
import NavigationLinks from "./navigation-links"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { AuthStateHandler } from "@/components/auth"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
// import Link from "next/link"; // Not strictly needed if no brand link in header

/**
 * Unified Header Component that includes both banner and navigation sections
 * - Banner: Contains the NGDI logo and branding
 * - Header: Contains navigation, search, and user controls
 */
export default function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Handle scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when clicking outside and manage body scroll
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
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  return (
    <div className="sticky top-0 z-40 flex flex-col">
      {/* ===== BANNER SECTION ===== */}
      <div
        className="bg-gradient-to-r from-slate-800 to-slate-600 h-[var(--banner-height)] flex items-center text-white"
        role="banner"
        aria-label="NGDI Portal Banner"
      >
        <div className="container mx-auto flex items-center justify-center px-4">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
            aria-label="NGDI Portal - Go to homepage"
          >
            <Image
              src="/img/logo.png"
              alt="NGDI Portal Logo"
              width={600}
              height={40}
              className="mx-auto"
              priority
            />
          </Link>
        </div>
      </div>

      {/* ===== NAVIGATION HEADER ===== */}
      <header
        className={cn(
          "w-full h-[var(--header-height)] border-b transition-all duration-200",
          isScrolled
            ? "bg-gradient-to-r from-background/95 to-background/90 shadow-md backdrop-blur-sm"
            : "bg-gradient-to-r from-background to-background/95"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto flex h-full items-center justify-between space-x-4 px-4 sm:justify-between sm:space-x-0">
          {/* Desktop Navigation Links */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <NavigationLinks />
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center justify-end space-x-2 md:flex-1 md:justify-end">
            <GlobalSearchBar />
            <ThemeSwitcher />
            <AuthStateHandler />

            {/* Mobile Menu Toggle */}
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
                className="hover:bg-accent"
              >
                {isMenuOpen ? (
                  <X className="size-6" />
                ) : (
                  <Menu className="size-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div
            className="bg-background border-t md:hidden shadow-lg backdrop-blur-sm"
            id="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation menu"
            data-mobile-menu
          >
            <nav className="container mx-auto flex flex-col space-y-2 p-4">
              <NavigationLinks />
            </nav>
          </div>
        )}
      </header>
    </div>
  )
}
