/*
<ai_context>
This server page is the marketing homepage.
</ai_context>
*/

"use server"

import { FeaturesSection } from "@/components/landing/features"
import { HeroSection } from "@/components/landing/hero"
import { Separator } from "@/components/ui/separator"

/**
 * Placeholder component for sections that will be implemented in the future
 */
const PlaceholderSection = ({ title }: { title: string }) => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-500 dark:text-gray-400">
            {title} Section
          </h2>
          <p className="text-gray-400 dark:text-gray-500">
            This section will be implemented in the future
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  return (
    <div className="flex w-full flex-col">
      {/* Hero Section */}
      <section className="w-full">
        <div className="container mx-auto px-4">
          <HeroSection />
        </div>
      </section>

      <Separator className="my-8" />

      {/* Social Proof Section */}
      <PlaceholderSection title="Social Proof" />

      {/* Features Section - Already has its own container */}
      <FeaturesSection />

      <Separator className="my-8" />

      {/* Pricing Section */}
      <PlaceholderSection title="Pricing" />

      <Separator className="my-8" />

      {/* FAQ Section */}
      <PlaceholderSection title="FAQ" />

      <Separator className="my-8" />

      {/* Blog Section */}
      <PlaceholderSection title="Blog" />
    </div>
  )
}
