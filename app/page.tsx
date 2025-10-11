"use server"

import { Suspense } from "react"
import { HeroSection } from "@/components/landing/hero-section"
import { UserTypesSection } from "@/components/landing/user-types-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ContributingOrganizationsFetcher } from "./_components/contributing-organizations-fetcher"
import { ContributingOrganizationsSkeleton } from "./_components/contributing-organizations-skeleton"

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* User Types Section */}
      <UserTypesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Contributing Organizations Section */}
      <Suspense fallback={<ContributingOrganizationsSkeleton />}>
        <ContributingOrganizationsFetcher />
      </Suspense>
    </div>
  )
}
