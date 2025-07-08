"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Globe, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  description?: string | null
  websiteUrl?: string | null
  logoUrl?: string | null
  category?: string
}

interface OrganizationCardProps {
  organization: Organization
  index: number
  hovered: number | null
  setHovered: React.Dispatch<React.SetStateAction<number | null>>
}

const OrganizationCard = React.memo(
  ({ organization, index, hovered, setHovered }: OrganizationCardProps) => {
    const [imageError, setImageError] = useState(false)

    return (
      <motion.div
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        className={cn(
          "relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden transition-all duration-150 ease-out cursor-pointer group shadow-lg",
          "hover:shadow-xl hover:scale-[1.02]",
          hovered !== null &&
            hovered !== index &&
            "blur-sm scale-[0.98] opacity-70"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
        whileHover={{ y: -4, transition: { duration: 0.15 } }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white shadow-md flex items-center justify-center">
              {organization.logoUrl && !imageError ? (
                <img
                  src={organization.logoUrl}
                  alt={`${organization.name} logo`}
                  className="w-full h-full object-contain p-2"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {organization.name}
              </h3>
              {organization.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 mt-1">
                  {organization.category}
                </span>
              )}
            </div>
          </div>

          {/* Description with custom line clamping */}
          <div className="text-sm text-gray-600 flex-1 mb-4">
            <p className="line-clamp-3">
              {organization.description || "No description provided."}
            </p>
          </div>

          {/* Website Link */}
          {organization.websiteUrl && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="w-4 h-4" />
                <span className="truncate">
                  {organization.websiteUrl.replace(/^https?:\/\//, "")}
                </span>
              </div>
              <motion.a
                href={organization.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-100 rounded-md hover:bg-emerald-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={e => e.stopPropagation()}
              >
                Visit
                <ExternalLink className="w-3 h-3" />
              </motion.a>
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <AnimatePresence>
          {hovered === index && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

OrganizationCard.displayName = "OrganizationCard"

interface OrganizationCarouselProps {
  organizations?: Organization[]
  columns?: number
  className?: string
}

export function OrganizationCarousel({
  organizations = [],
  columns = 3,
  className
}: OrganizationCarouselProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No organizations to display</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "grid gap-6 auto-rows-fr",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 md:grid-cols-2",
          columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          columns === 4 &&
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {organizations.map((organization, index) => (
          <OrganizationCard
            key={organization.id}
            organization={organization}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
          />
        ))}
      </div>
    </div>
  )
}
