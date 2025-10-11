"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Search, X, Building2, Users } from "lucide-react"
import { OrganizationCarousel } from "@/components/ui/organization-carousel"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"

// Type for public organizations display (subset of SelectOrganization)
type PublicOrganization = Pick<
  SelectOrganization,
  "id" | "name" | "logoUrl" | "websiteUrl" | "description"
>

interface ContributingOrganizationsProps {
  organizations: PublicOrganization[]
  className?: string
}

export function ContributingOrganizations({
  organizations,
  className
}: ContributingOrganizationsProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Filter organizations based on search
  const filteredOrganizations = useMemo(() => {
    if (!debouncedSearchQuery) return organizations

    const query = debouncedSearchQuery.toLowerCase()
    return organizations.filter(
      org =>
        org.name.toLowerCase().includes(query) ||
        org.description?.toLowerCase().includes(query)
    )
  }, [organizations, debouncedSearchQuery])

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <section className={cn("relative py-24 px-4 overflow-hidden", className)}>
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-indigo-50/40 dark:from-cyan-950/20 dark:via-blue-950/10 dark:to-indigo-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-100/20 via-transparent to-transparent dark:from-cyan-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent dark:from-indigo-900/10" />

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
            Contributing Organizations
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Meet the institutions and organizations driving Nigeria's geospatial
            data initiative forward
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 flex flex-col sm:flex-row gap-4 items-center justify-center"
        >
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-card/80 backdrop-blur-sm border-border"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Organization Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span>
              {filteredOrganizations.length} of {organizations.length}{" "}
              organizations
            </span>
          </div>
        </motion.div>

        {/* Organizations Display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filteredOrganizations.length > 0 ? (
            <OrganizationCarousel
              organizations={filteredOrganizations}
              columns={3}
              className="mb-12"
            />
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No organizations found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search
              </p>
              <Button variant="outline" onClick={clearSearch}>
                Clear search
              </Button>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/organizations">
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "px-8 py-4 text-lg font-semibold",
                "bg-card/80 backdrop-blur-sm border-border",
                "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                "transition-all duration-300"
              )}
            >
              View All Organizations
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              className="px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              <Users className="w-5 h-5 mr-2" />
              Become a Partner
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
