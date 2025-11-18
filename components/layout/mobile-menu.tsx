"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Globe2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import GlobalSearchBar from "@/components/search/global-search-bar"
import { useUser } from "@clerk/nextjs"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  showSearchBar?: boolean
}

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
  { href: "/committee", label: "Committee" },
  { href: "/publications", label: "Publications" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" }
]

export function MobileMenu({
  isOpen,
  onClose,
  showSearchBar = true
}: MobileMenuProps) {
  const { isSignedIn } = useUser()

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed top-0 right-0 h-screen w-80 max-w-[85vw]",
              "bg-slate-900 backdrop-blur-md shadow-2xl z-[60]",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center space-x-2 text-white"
              >
                <Globe2 className="w-6 h-6" />
                <span className="font-bold text-lg">NGDI</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>

            {/* Search Bar */}
            {showSearchBar && (
              <div className="p-6 border-b border-white/10">
                <GlobalSearchBar />
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6">
              <ul className="space-y-1 px-4">
                {navigationLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "block px-4 py-3 rounded-lg text-white/90",
                        "hover:bg-white/10 hover:text-white",
                        "transition-colors duration-200",
                        "text-base font-medium"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Auth Buttons */}
            <div className="p-6 border-t border-white/10 space-y-3">
              {isSignedIn ? (
                <Link href="/dashboard" onClick={onClose} className="block">
                  <Button className="w-full bg-white text-slate-900 hover:bg-white/90">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={onClose} className="block">
                    <Button
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={onClose} className="block">
                    <Button className="w-full bg-white text-slate-900 hover:bg-white/90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
