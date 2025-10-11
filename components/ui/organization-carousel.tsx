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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className="relative group"
      >
        <div
          className={cn(
            "relative bg-card/80 backdrop-blur-sm border border-border rounded-xl p-8 h-full",
            "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10",
            "hover:border-primary/40 overflow-hidden"
          )}
        >
          {/* Logo and Title Section */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={cn(
                "p-3 rounded-xl bg-primary/10 flex-shrink-0",
                "group-hover:bg-primary/15 transition-colors duration-300"
              )}
            >
              {organization.logoUrl && !imageError ? (
                <img
                  src={organization.logoUrl}
                  alt={`${organization.name} logo`}
                  className="w-12 h-12 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Building2 className="w-12 h-12 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                {organization.name}
              </h3>
              {organization.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {organization.category}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-muted-foreground leading-relaxed line-clamp-3">
              {organization.description || "No description provided."}
            </p>
          </div>

          {/* Website Link */}
          {organization.websiteUrl && (
            <div className="pt-4 border-t border-border">
              <motion.a
                href={organization.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium text-primary",
                  "hover:text-primary/80 transition-colors duration-300"
                )}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
              >
                <Globe className="w-4 h-4" />
                <span className="truncate">Visit Website</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </motion.a>
            </div>
          )}

          {/* Hover Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
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
