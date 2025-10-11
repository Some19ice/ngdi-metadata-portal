"use client"

import { SelectOrganization } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel"
import GlassCard from "@/components/ui/glass-card"
import Link from "next/link"
import Image from "next/image"

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
    <section
      className="pt-8 pb-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
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

        {organizations.length > 1 ? (
          <Carousel className="relative" opts={{ align: "center", loop: true }}>
            <CarouselContent>
              {organizations.map(org => (
                <CarouselItem key={org.id} className="flex justify-center px-4">
                  <GlassCard
                    className="h-[300px] w-[290px]"
                    logoUrl={org.logoUrl ?? undefined}
                    name={org.name ?? undefined}
                    description={org.description ?? undefined}
                    websiteUrl={org.websiteUrl ?? undefined}
                    socials={[]}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-6" />
            <CarouselNext className="-right-6" />
          </Carousel>
        ) : (
          <div className="flex justify-center">
            {organizations.length === 1 ? (
              <GlassCard
                className="h-[300px] w-[290px]"
                logoUrl={organizations[0].logoUrl ?? undefined}
                name={organizations[0].name ?? undefined}
                description={organizations[0].description ?? undefined}
                websiteUrl={organizations[0].websiteUrl ?? undefined}
                socials={[]}
              />
            ) : null}
          </div>
        )}

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
