import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Map, Database, Users, Shield, Zap } from "lucide-react"

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  benefits: string[]
  category: string
}

interface FeaturesSectionProps {
  title?: string
  subtitle?: string
  features?: Feature[]
}

const GeospatialFeaturesSection: React.FC<FeaturesSectionProps> = ({
  title = "NGDI Metadata Portal Features",
  subtitle = "Comprehensive tools and features designed for professional geospatial metadata management and access",
  features = [
    {
      id: "advanced-search",
      title: "Advanced Search",
      description:
        "Powerful search capabilities with spatial, temporal, and metadata filters to quickly locate the exact datasets you need.",
      icon: Search,
      benefits: [
        "Spatial queries",
        "Temporal filtering",
        "Metadata search",
        "Boolean operators"
      ],
      category: "Discovery"
    },
    {
      id: "interactive-maps",
      title: "Interactive Maps",
      description:
        "High-performance mapping interface with multi-layer visualization, real-time rendering, and advanced cartographic tools.",
      icon: Map,
      benefits: [
        "Multi-layer support",
        "Real-time rendering",
        "Custom symbology",
        "3D visualization"
      ],
      category: "Visualization"
    },
    {
      id: "rich-metadata",
      title: "Rich Metadata",
      description:
        "Comprehensive metadata management following international standards for complete dataset documentation and discovery.",
      icon: Database,
      benefits: [
        "ISO 19115 compliant",
        "Automated extraction",
        "Quality metrics",
        "Lineage tracking"
      ],
      category: "Management"
    },
    {
      id: "collaboration",
      title: "Collaboration",
      description:
        "Team-based workflows with sharing capabilities, project management, and collaborative editing tools for distributed teams.",
      icon: Users,
      benefits: [
        "Team workspaces",
        "Version control",
        "Shared projects",
        "Real-time editing"
      ],
      category: "Workflow"
    },
    {
      id: "secure-access",
      title: "Secure Access",
      description:
        "Enterprise-grade security with role-based access control, encryption, and compliance with government security standards.",
      icon: Shield,
      benefits: [
        "RBAC system",
        "Data encryption",
        "Audit trails",
        "Compliance ready"
      ],
      category: "Security"
    },
    {
      id: "api-integration",
      title: "API Integration",
      description:
        "RESTful APIs and OGC-compliant web services for seamless integration with existing systems and custom applications.",
      icon: Zap,
      benefits: [
        "RESTful APIs",
        "OGC services",
        "SDK support",
        "Webhook integration"
      ],
      category: "Integration"
    }
  ]
}) => {
  return (
    <section className="relative py-24 px-4">
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">{title}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(feature => {
            const IconComponent = feature.icon
            return (
              <Card
                key={feature.id}
                className="group relative overflow-hidden border-border bg-card/80 backdrop-blur-sm hover:bg-accent/5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="p-8">
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-primary/10 text-primary border-primary/20"
                    >
                      {feature.category}
                    </Badge>
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Benefits List */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-sm font-medium text-foreground">
                        Key Features:
                      </h4>
                      <ul className="space-y-1">
                        {feature.benefits.map((benefit, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-center"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Hover Effect Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted/50 backdrop-blur-sm border border-border">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Enterprise-ready • Government compliant • Scalable architecture
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GeospatialFeaturesSection
