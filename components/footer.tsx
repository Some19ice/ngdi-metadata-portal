"use client"

import Link from "next/link"
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  MapPin,
  Mail,
  Phone
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t bg-slate-800 text-white py-12 relative z-50",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">NGDI Portal</h3>
            <p className="text-slate-300 mb-4">
              Your central hub for accessing and utilizing national geospatial
              data and metadata.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                aria-label="Facebook"
                className="text-slate-300 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-slate-300 hover:text-white"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-slate-300 hover:text-white"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="text-slate-300 hover:text-white"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/metadata/search" className="hover:text-white">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-white">
                  Map
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/news" className="hover:text-white">
                  News & Updates
                </Link>
              </li>
              <li>
                <Link href="/publications" className="hover:text-white">
                  Publications
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/committee" className="hover:text-white">
                  Committee
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  NASRDA Obasanjo Space Center, Umaru Musa Yar'Adua Expressway,
                  Abuja, FCT, Nigeria
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <a
                  href="mailto:contact@nasrda.gov.ng"
                  className="hover:text-white"
                >
                  contact@nasrda.gov.ng
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <a href="tel:+2348092079000" className="hover:text-white">
                  +234 809 207 9000
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} NGDI Portal. All rights
              reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/terms"
                className="text-sm text-slate-400 hover:text-white"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-slate-400 hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
