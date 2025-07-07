"use server"

import { Suspense } from "react"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { ContributingOrganizationsFetcher } from "./_components/contributing-organizations-fetcher"
import { ContributingOrganizationsSkeleton } from "./_components/contributing-organizations-skeleton"

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Contributing Organizations Section */}
      <Suspense fallback={<ContributingOrganizationsSkeleton />}>
        <ContributingOrganizationsFetcher />
      </Suspense>
    </div>
  )
}
