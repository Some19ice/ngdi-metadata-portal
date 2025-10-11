"use client"

import { motion } from "framer-motion"
import {
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  LucideIcon,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UserType {
  id: string
  icon: LucideIcon
  title: string
  description: string
  benefits: string[]
  ctaText: string
  ctaLink: string
}

interface UserTypesSectionProps {
  className?: string
  userTypes?: UserType[]
}

const defaultUserTypes: UserType[] = [
  {
    id: "government",
    icon: Building2,
    title: "Government Agencies",
    description:
      "Streamline data sharing and collaboration across federal, state, and local agencies.",
    benefits: [
      "Centralized metadata management",
      "Inter-agency data sharing",
      "Compliance with national standards",
      "Audit trails and governance"
    ],
    ctaText: "For Government",
    ctaLink: "/about"
  },
  {
    id: "researchers",
    icon: GraduationCap,
    title: "Researchers",
    description:
      "Access comprehensive geospatial data for academic research and analysis.",
    benefits: [
      "Extensive dataset catalog",
      "API access for automation",
      "Citation and attribution tools",
      "Collaboration features"
    ],
    ctaText: "For Research",
    ctaLink: "/about"
  },
  {
    id: "private",
    icon: Briefcase,
    title: "Private Sector",
    description:
      "Leverage geospatial data for business intelligence and decision-making.",
    benefits: [
      "Commercial data access",
      "Integration capabilities",
      "Custom data requests",
      "Technical support"
    ],
    ctaText: "For Business",
    ctaLink: "/about"
  },
  {
    id: "public",
    icon: Users,
    title: "General Public",
    description:
      "Explore Nigeria's geospatial data for education, planning, and awareness.",
    benefits: [
      "Free public datasets",
      "Easy-to-use interface",
      "Educational resources",
      "Community forums"
    ],
    ctaText: "Get Started",
    ctaLink: "/signup"
  }
]

export function UserTypesSection({
  className,
  userTypes = defaultUserTypes
}: UserTypesSectionProps) {
  return (
    <section className={cn("relative py-24 px-4 overflow-hidden", className)}>
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-emerald-50/30 to-cyan-50/40 dark:from-blue-950/20 dark:via-emerald-950/10 dark:to-cyan-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent dark:from-emerald-900/10" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Who We Serve
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Tailored solutions for every user, from government agencies to
            individual researchers
          </p>
        </motion.div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {userTypes.map((userType, index) => {
            const Icon = userType.icon
            return (
              <motion.div
                key={userType.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="relative group"
              >
                <div
                  className={cn(
                    "relative bg-card/80 backdrop-blur-sm border border-border rounded-xl p-8",
                    "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10",
                    "hover:border-primary/40 overflow-hidden"
                  )}
                >
                  {/* Icon Badge */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={cn(
                        "p-3 rounded-xl bg-primary/10",
                        "group-hover:bg-primary/15 transition-colors duration-300"
                      )}
                    >
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-foreground mb-2">
                        {userType.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {userType.description}
                      </p>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-foreground">
                      Key Benefits:
                    </h4>
                    <ul className="space-y-2">
                      {userType.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-start"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 mt-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link href={userType.ctaLink}>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                    >
                      {userType.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  {/* Hover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
