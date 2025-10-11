"use client"

import { motion } from "framer-motion"
import { Search, Map, Download, LucideIcon, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkflowStep {
  id: string
  number: number
  icon: LucideIcon
  title: string
  description: string
}

interface HowItWorksSectionProps {
  className?: string
  steps?: WorkflowStep[]
}

const defaultSteps: WorkflowStep[] = [
  {
    id: "search",
    number: 1,
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse our comprehensive catalog of geospatial datasets using advanced search filters and spatial queries."
  },
  {
    id: "explore",
    number: 2,
    icon: Map,
    title: "Explore & Analyze",
    description:
      "Visualize datasets on interactive maps with multi-layer support and real-time rendering capabilities."
  },
  {
    id: "access",
    number: 3,
    icon: Download,
    title: "Access & Download",
    description:
      "Download datasets or integrate via our RESTful APIs and OGC-compliant web services."
  }
]

export function HowItWorksSection({
  className,
  steps = defaultSteps
}: HowItWorksSectionProps) {
  return (
    <section className={cn("relative py-24 px-4 overflow-hidden", className)}>
      {/* Clean Background with Subtle Pattern */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />

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
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Get started with Nigeria's geospatial data in three simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting lines for desktop */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <div
                  className={cn(
                    "relative bg-card/80 backdrop-blur-sm border border-border rounded-xl p-8",
                    "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10",
                    "hover:border-primary/40"
                  )}
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br from-primary to-primary/80",
                        "text-white font-bold text-xl shadow-lg",
                        "border-4 border-background"
                      )}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-6 mt-4">
                    <div
                      className={cn(
                        "p-4 rounded-xl bg-primary/10",
                        "group-hover:bg-primary/15 transition-colors duration-300"
                      )}
                    >
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow indicator for mobile */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-6">
                      <ArrowRight className="w-6 h-6 text-primary/40 rotate-90" />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
