"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function ContributingOrganizationsSkeleton() {
  return (
    <section
      className="relative py-24 px-4 overflow-hidden"
      aria-labelledby="contributing-orgs"
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-indigo-50/40 dark:from-cyan-950/20 dark:via-blue-950/10 dark:to-indigo-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-100/20 via-transparent to-transparent dark:from-cyan-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent dark:from-indigo-900/10" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            id="contributing-orgs"
            className="text-4xl font-bold text-foreground mb-4"
          >
            Contributing Organizations
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Meet the institutions and organizations driving Nigeria's geospatial
            data initiative forward
          </p>
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Skeleton className="h-10 w-full sm:w-96 rounded-md" />
          <Skeleton className="h-6 w-48 rounded-md" />
        </div>

        {/* Organizations Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-48 w-full rounded-xl"
              aria-label={`Loading organization ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="outline" size="lg" disabled className="px-8 py-4">
            View All Organizations
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" disabled className="px-8 py-4">
            <Users className="w-5 h-5 mr-2" />
            Become a Partner
          </Button>
        </div>
      </div>
    </section>
  )
}
