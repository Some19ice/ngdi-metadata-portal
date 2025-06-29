"use client"

import { SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Type for public organizations display (subset of SelectOrganization)
type PublicOrganization = Pick<
  SelectOrganization,
  "id" | "name" | "logoUrl" | "websiteUrl"
>

interface ContributingOrganizationsProps {
  organizations: PublicOrganization[]
}

export function ContributingOrganizations({
  organizations
}: ContributingOrganizationsProps) {
  return (
    <section
      className="py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
      aria-labelledby="contributing-orgs"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 id="contributing-orgs" className="text-3xl font-bold mb-3">
            Contributing Organizations
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The NGDI Portal is made possible by the contributions of numerous
            organizations dedicated to improving access to geospatial data.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8">
          {organizations.length > 0
            ? organizations.map(org => (
                <div
                  key={org.id}
                  className="h-16 w-32 rounded-md bg-background shadow-sm flex items-center justify-center hover:shadow-md transition-all duration-300 hover:scale-105 border relative group"
                  role="img"
                  aria-label={`${org.name} logo`}
                >
                  {org.logoUrl ? (
                    <Image
                      src={org.logoUrl}
                      alt={`${org.name} logo`}
                      fill
                      className="object-contain p-2 rounded-md"
                      sizes="(max-width: 128px) 100vw, 128px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                      <Building className="h-6 w-6" />
                    </div>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-md">
                    {org.name}
                  </div>
                </div>
              ))
            : // Fallback when no organizations are loaded
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 w-32 rounded-md bg-background shadow-sm flex items-center justify-center hover:shadow-md transition-all duration-300 hover:scale-105 border"
                  role="img"
                  aria-label={`Organization ${index + 1} logo placeholder`}
                >
                  <div className="bg-gradient-to-r from-muted to-muted-foreground/20 h-8 w-20 rounded" />
                </div>
              ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/committee">
            <Button variant="outline" className="group">
              View All Organizations
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
