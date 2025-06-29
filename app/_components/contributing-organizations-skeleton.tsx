"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function ContributingOrganizationsSkeleton() {
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
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-16 w-32 rounded-md"
              aria-label={`Loading organization ${index + 1}`}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" className="group" disabled>
            View All Organizations
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
