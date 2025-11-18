"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Globe2,
  Send,
  Dribbble,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: "About",
    links: [
      { label: "About NGDI", href: "/about" },
      { label: "Our Mission", href: "/about#mission" },
      { label: "Committee", href: "/committee" },
      { label: "Contact Us", href: "/contact" }
    ]
  },
  {
    title: "Quick Links",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API", href: "/docs#api" },
      { label: "Support", href: "/contact" },
      { label: "FAQ", href: "/faq" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/privacy#cookies" },
      { label: "Accessibility", href: "/about#accessibility" }
    ]
  }
]

const socialLinks = [
  { icon: Dribbble, href: "#", label: "Dribbble" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" }
]

export function Footer({ className }: { className?: string }) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implement newsletter subscription server action
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success("Successfully subscribed to newsletter!")
      setEmail("")
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className={cn("relative w-full px-4 pb-4", className)}>
      <div
        className={cn(
          "bg-[#1a1a1a] text-white",
          "rounded-3xl border border-slate-800/50 shadow-2xl",
          "max-w-7xl mx-auto px-8 py-10 md:px-12 md:py-12"
        )}
      >
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Section - Branding & Newsletter */}
          <div className="flex-1 space-y-6 lg:pr-12 lg:border-r border-slate-800/50">
            {/* Logo & Tagline */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-400">
                    NGDI
                  </div>
                  <div className="text-xs text-slate-500">Portal</div>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                Nigeria's National Geospatial Data Infrastructure portal,
                providing comprehensive access to geospatial metadata and
                resources for informed decision-making.
              </p>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Subscribe to our newsletter
              </p>
              <form onSubmit={handleNewsletterSubmit} className="relative">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={cn(
                    "bg-slate-800/50 border-slate-700/50 text-white h-11 pr-12",
                    "placeholder:text-slate-500 rounded-xl",
                    "focus:border-slate-600 focus:bg-slate-800/70 transition-all"
                  )}
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSubmitting}
                  className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600"
                >
                  <Send className="w-4 h-4" />
                  <span className="sr-only">Subscribe</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Right Section - Links & Social */}
          <div className="flex-1 flex gap-6 lg:gap-8">
            {/* Links Columns with Dividers */}
            <div className="flex-1 flex gap-6 lg:gap-8">
              {footerSections.map((section, index) => (
                <div key={section.title} className="flex gap-6 lg:gap-8">
                  <div className="space-y-3 flex-1">
                    <h3 className="text-sm font-semibold text-slate-300">
                      {section.title}
                    </h3>
                    <ul className="space-y-2">
                      {section.links.map(link => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {index < footerSections.length - 1 && (
                    <div className="w-px bg-slate-800/50" />
                  )}
                </div>
              ))}
            </div>

            {/* Vertical Divider before Social */}
            <div className="w-px bg-slate-800/50 hidden lg:block" />

            {/* Social Icons - Vertical */}
            <div className="flex flex-col gap-3">
              {socialLinks.map(social => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50",
                      "flex items-center justify-center",
                      "transition-all duration-200 hover:scale-105"
                    )}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
