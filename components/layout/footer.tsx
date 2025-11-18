"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Globe2,
  Send,
  Github as GithubIcon,
  Twitter as TwitterIcon,
  Linkedin as LinkedinIcon
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
  { icon: TwitterIcon, href: "#", label: "Twitter" },
  { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  { icon: GithubIcon, href: "#", label: "GitHub" }
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
    <footer
      className={cn(
        "relative bg-slate-900 text-white border-t border-slate-800",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
          {/* About Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Globe2 className="w-5 h-5 text-primary" />
              <span className="font-bold text-base">NGDI Portal</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nigeria's National Geospatial Data Infrastructure portal,
              providing comprehensive access to geospatial metadata and
              resources for informed decision-making.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map(section => (
            <div key={section.title} className="space-y-2">
              <h3 className="font-semibold text-sm">{section.title}</h3>
              <ul className="space-y-1">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-xs text-slate-400 hover:text-white",
                        "transition-colors duration-200",
                        "inline-block hover:translate-x-1 transform"
                      )}
                      {...(link.external && {
                        target: "_blank",
                        rel: "noopener noreferrer"
                      })}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Connect</h3>

            {/* Social Links */}
            <div className="flex space-x-1.5">
              {socialLinks.map(social => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700",
                      "transition-colors duration-200",
                      "hover:scale-105 transform"
                    )}
                    aria-label={social.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                )
              })}
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium">Newsletter</h4>
              <form onSubmit={handleNewsletterSubmit} className="space-y-1">
                <div className="flex gap-1.5">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn(
                      "bg-slate-800 border-slate-700 text-white h-8 text-xs",
                      "placeholder:text-slate-500",
                      "focus:border-primary"
                    )}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSubmitting}
                    className="flex-shrink-0 h-8 w-8"
                  >
                    <Send className="w-3 h-3" />
                    <span className="sr-only">Subscribe</span>
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Get updates on new datasets
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} NGDI Metadata Portal. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
