"use client"

import { SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { OrganizationCarousel } from "@/components/ui/organization-carousel"
import Link from "next/link"

// Type for public organizations display (subset of SelectOrganization)
type PublicOrganization = Pick<
  SelectOrganization,
  "id" | "name" | "logoUrl" | "websiteUrl" | "description"
>

interface ContributingOrganizationsProps {
  organizations: PublicOrganization[]
}

export function ContributingOrganizations({
  organizations
}: ContributingOrganizationsProps) {
  return (
    <section className="relative py-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            Contributing Organizations
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Meet the institutions and organizations driving Nigeria's geospatial
            data initiative forward
          </p>
        </div>

        {/* Use 21st dev magic component */}
        <OrganizationCarousel
          organizations={organizations}
          columns={3}
          className="mb-12"
        />

        <div className="text-center">
          <Link href="/organizations">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg font-semibold border-cyan-500/30 text-black bg-emerald-700/10 hover:bg-emerald-700/20 transition-all duration-200 hover:border-cyan-500/50 backdrop-blur-[1px]"
            >
              View All Organizations
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
