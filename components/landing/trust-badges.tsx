"use client"

import { motion } from "framer-motion"
import { Shield, CheckCircle, Lock, RefreshCw, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrustBadge {
  id: string
  icon: LucideIcon
  label: string
  description?: string
}

interface TrustBadgesProps {
  className?: string
  badges?: TrustBadge[]
}

const defaultTrustBadges: TrustBadge[] = [
  {
    id: "government",
    icon: Shield,
    label: "Government Approved",
    description: "Official NGDI Portal"
  },
  {
    id: "iso",
    icon: CheckCircle,
    label: "ISO 19115 Compliant",
    description: "International standards"
  },
  {
    id: "security",
    icon: Lock,
    label: "Secure & Encrypted",
    description: "Enterprise-grade security"
  },
  {
    id: "updated",
    icon: RefreshCw,
    label: "Updated Daily",
    description: "Fresh data"
  }
]

export function TrustBadges({
  className,
  badges = defaultTrustBadges
}: TrustBadgesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4",
        className
      )}
    >
      {badges.map((badge, index) => {
        const Icon = badge.icon
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className={cn(
              "flex flex-col items-center justify-center p-3 md:p-4",
              "bg-white/10 backdrop-blur-sm rounded-lg border border-white/20",
              "transition-all duration-300 hover:bg-white/20 hover:shadow-lg",
              "cursor-default"
            )}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white/90 mb-2" />
            <span className="text-xs md:text-sm font-medium text-white/90 text-center">
              {badge.label}
            </span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
