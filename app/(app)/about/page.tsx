/*
<ai_context>
This server page returns an enhanced "About Page" component with improved layout, animations, and interactive elements.
</ai_context>
*/

"use server"

import {
  ArrowRight,
  Users,
  Database,
  Globe,
  Shield,
  TrendingUp,
  Target
} from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Statistics data - replace with actual data fetching in the future
const statistics = [
  {
    id: 1,
    label: "Contributing Organizations",
    value: "50+",
    icon: Users,
    description:
      "Government agencies, private sector, and academic institutions"
  },
  {
    id: 2,
    label: "Datasets Available",
    value: "1,200+",
    icon: Database,
    description: "Comprehensive geospatial datasets across various sectors"
  },
  {
    id: 3,
    label: "Coverage Area",
    value: "100%",
    icon: Globe,
    description: "Complete coverage of Nigeria's 36 states and FCT"
  },
  {
    id: 4,
    label: "Data Standards",
    value: "ISO 19115",
    icon: Shield,
    description: "International standards for geospatial metadata"
  }
]

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-10 text-center bg-gradient-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="inline-block px-4 py-2 mb-6 bg-primary-light/50 text-primary-foreground rounded-full text-sm font-medium backdrop-blur-sm border border-primary/30">
            <Target className="inline w-4 h-4 mr-2" />
            About NGDI
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-md text-primary-foreground mb-6">
            About NGDI
          </h1>
          <p className="mt-6 text-xl leading-8 text-primary-foreground/90 drop-shadow-sm max-w-3xl mx-auto">
            Creating a unified framework for geospatial data production,
            management, sharing, and utilization across Nigeria
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {statistics.map(stat => {
              const IconComponent = stat.icon
              return (
                <div
                  key={stat.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <IconComponent className="w-8 h-8 text-primary-foreground/80 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-2xl font-bold text-primary-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-foreground/80">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-20">
        {/* Mission and Vision Cards */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl p-8 shadow-elevated border hover:shadow-floating transition-all duration-300 group">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-primary/10 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors duration-300">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-primary">
                Our Vision
              </h3>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              To optimize the use of geospatial data as a critical resource for
              sustainable development and efficient service delivery across
              Nigeria.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-elevated border hover:shadow-floating transition-all duration-300 group">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-success/10 rounded-lg mr-4 group-hover:bg-success/20 transition-colors duration-300">
                <Target className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-2xl font-semibold text-success">
                Our Mission
              </h3>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              To establish institutional, legal, technical, and administrative
              frameworks for coordinating the production, sharing, and
              dissemination of standardized geospatial data across all levels of
              governance in Nigeria.
            </p>
          </div>
        </section>

        {/* Introduction Section */}
        <section id="introduction">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-semibold mb-6 text-foreground text-center">
                What is NGDI?
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground text-center">
                The National Geo-Spatial Data Infrastructure (NGDI) is a
                strategic initiative aimed at creating a unified framework for
                geospatial data production, management, sharing, and utilization
                in Nigeria. With geospatial information underpinning
                approximately 80% of planning and decision-making processes, the
                NGDI addresses the need for accurate, accessible, and
                interoperable geospatial datasets across all sectors of the
                economy.
              </p>
            </div>
          </div>
        </section>

        {/* Tab-based Content */}
        <section id="tabs">
          <Tabs defaultValue="objectives" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                <TabsTrigger value="objectives" className="text-sm">
                  Objectives
                </TabsTrigger>
                <TabsTrigger value="components" className="text-sm">
                  Core Components
                </TabsTrigger>
                <TabsTrigger value="involved" className="text-sm">
                  Get Involved
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Objectives Tab */}
            <TabsContent value="objectives">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  NGDI Strategic Objectives
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      number: "01",
                      title: "Foster Collaboration",
                      description:
                        "Facilitate collaboration among geospatial data producers, managers, and users across all sectors"
                    },
                    {
                      number: "02",
                      title: "Promote Standards",
                      description:
                        "Promote standardized data collection and dissemination mechanisms for consistency"
                    },
                    {
                      number: "03",
                      title: "Eliminate Duplication",
                      description:
                        "Eliminate duplication in data acquisition and maintenance, improving cost-efficiency"
                    },
                    {
                      number: "04",
                      title: "Ensure Availability",
                      description:
                        "Ensure the availability of core datasets to support national planning, disaster management, and economic growth"
                    },
                    {
                      number: "05",
                      title: "Build Capacity",
                      description:
                        "Build capacity and promote research in geospatial technologies and applications"
                    },
                    {
                      number: "06",
                      title: "Encourage Innovation",
                      description:
                        "Encourage indigenous innovation in geospatial applications and solutions"
                    }
                  ].map(objective => (
                    <div
                      key={objective.number}
                      className="bg-card rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                            <span className="text-lg font-bold text-primary">
                              {objective.number}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-foreground mb-2">
                            {objective.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {objective.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Core Components Tab */}
            <TabsContent value="components">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  Core Components
                </h3>
                <div className="space-y-8">
                  {[
                    {
                      title: "Funding & Sustainability",
                      color: "emerald",
                      items: [
                        "Annual budgetary allocations from the Federal Government of Nigeria",
                        "Grants and technical assistance from international development partners",
                        "Public-private partnerships for sustainable financing of geospatial data infrastructure",
                        "Cost recovery mechanisms through data services and specialized products"
                      ]
                    },
                    {
                      title: "Governance Structure",
                      color: "blue",
                      items: [
                        "A National NGDI Council chaired by the Vice President of Nigeria provides strategic oversight",
                        "The Council is supported by a multidisciplinary NGDI Committee comprising representatives from federal ministries, private sectors, academia, and NGOs",
                        "NASRDA serves as the coordinating agency, ensuring policy implementation and stakeholder engagement"
                      ]
                    },
                    {
                      title: "Data Standards & Interoperability",
                      color: "purple",
                      items: [
                        "Adoption of Open Geospatial Consortium (OGC) standards to ensure data compatibility across systems",
                        "Development of national geospatial data guidelines for data collection, storage, and sharing",
                        "Implementation of ISO 19115 metadata standards for comprehensive data documentation"
                      ]
                    },
                    {
                      title: "Metadata & Clearinghouse Services",
                      color: "amber",
                      items: [
                        "Establishment of metadata catalogs and clearing houses to enable data discoverability and easy access",
                        "Regular updates to metadata to maintain data relevance and usability",
                        "Implementation of automated validation and quality control mechanisms"
                      ]
                    },
                    {
                      title: "Open Access & Data Security",
                      color: "rose",
                      items: [
                        "Open access policies for non-restricted datasets to encourage innovation",
                        "Secure systems to protect classified data and ensure intellectual property rights compliance",
                        "Role-based access control to manage data access based on user permissions"
                      ]
                    }
                  ].map(component => (
                    <div
                      key={component.title}
                      className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300"
                    >
                      <h4 className="text-xl font-semibold mb-4 text-primary">
                        {component.title}
                      </h4>
                      <ul className="space-y-3">
                        {component.items.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-3"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <span className="text-muted-foreground leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Fundamental Datasets */}
                  <div className="bg-card rounded-lg p-6 border">
                    <h4 className="text-xl font-semibold mb-4 text-info">
                      Fundamental Datasets
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Creation and maintenance of core geospatial datasets,
                      including:
                    </p>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                      {[
                        "Administrative boundaries",
                        "Topography and elevation",
                        "Land use and land cover",
                        "Transportation networks",
                        "Satellite imageries and image maps",
                        "Hydrological data (rivers, lakes, watersheds)",
                        "Population demographics and distribution",
                        "Cadastral information and land registry",
                        "Infrastructure and utilities networks",
                        "Soil and geological data",
                        "Environmental and ecological zones",
                        "Climate and meteorological data",
                        "Natural resources and mineral deposits",
                        "Cultural and heritage sites",
                        "Emergency management and disaster risk zones"
                      ].map((dataset, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-info"></div>
                          <span className="text-muted-foreground text-sm">
                            {dataset}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Building */}
                  <div className="bg-card rounded-lg p-6 border">
                    <h4 className="text-xl font-semibold mb-4 text-warning">
                      Capacity Building & Public Awareness
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-lg font-medium text-foreground mb-3">
                          Training & Development
                        </h5>
                        <ul className="space-y-2">
                          {[
                            "Training programs for nodal agencies to enhance technical expertise",
                            "Specialized workshops for NGDI Committee members on policy development",
                            "Technical skills development for government officials across all levels",
                            "Academic collaborations to integrate geospatial education into curricula"
                          ].map((item, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2"></div>
                              <span className="text-muted-foreground text-sm">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-lg font-medium text-foreground mb-3">
                          Outreach & Engagement
                        </h5>
                        <ul className="space-y-2">
                          {[
                            "Public awareness campaigns to promote geospatial data literacy",
                            "Stakeholder engagement sessions with private sector and civil society",
                            "Community outreach programs to demonstrate practical applications",
                            "Regular conferences and symposiums to share knowledge and best practices"
                          ].map((item, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2"></div>
                              <span className="text-muted-foreground text-sm">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Get Involved Tab */}
            <TabsContent value="involved">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  How to Get Involved
                </h3>
                <div className="max-w-4xl mx-auto">
                  <p className="text-muted-foreground mb-8 text-center">
                    Learn more about how you can contribute to or benefit from
                    the NGDI. We welcome partnerships with government agencies,
                    private sector organizations, academic institutions, and
                    civil society groups.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-card rounded-xl p-6 border hover:shadow-floating transition-all duration-300 group">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors duration-300">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground">
                          Contact Us
                        </h4>
                      </div>
                      <p className="text-muted-foreground mb-6 flex-grow">
                        Reach out to the NGDI secretariat with inquiries,
                        feedback, or partnership opportunities.
                      </p>
                      <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-md transition-colors duration-300 group"
                      >
                        Get in Touch
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>

                    <div className="bg-card rounded-xl p-6 border hover:shadow-floating transition-all duration-300 group">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-success/10 rounded-lg mr-3 group-hover:bg-success/20 transition-colors duration-300">
                          <Database className="h-6 w-6 text-success" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground">
                          Publications
                        </h4>
                      </div>
                      <p className="text-muted-foreground mb-6 flex-grow">
                        Access our technical papers, guidelines, standards
                        documents, and research publications.
                      </p>
                      <Link
                        href="/publications"
                        className="inline-flex items-center justify-center px-4 py-3 bg-success hover:bg-success/90 text-success-foreground font-medium rounded-lg shadow-md transition-colors duration-300 group"
                      >
                        Explore Publications
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>

                    <div className="bg-card rounded-xl p-6 border hover:shadow-floating transition-all duration-300 group">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-warning/10 rounded-lg mr-3 group-hover:bg-warning/20 transition-colors duration-300">
                          <TrendingUp className="h-6 w-6 text-warning" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground">
                          News & Events
                        </h4>
                      </div>
                      <p className="text-muted-foreground mb-6 flex-grow">
                        Stay informed about the latest developments, upcoming
                        workshops, conferences, and training opportunities.
                      </p>
                      <Link
                        href="/news"
                        className="inline-flex items-center justify-center px-4 py-3 bg-warning hover:bg-warning/90 text-warning-foreground font-medium rounded-lg shadow-md transition-colors duration-300 group"
                      >
                        Latest News
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>

                  {/* Additional engagement options */}
                  <div className="mt-12 grid md:grid-cols-2 gap-6">
                    <div className="bg-card rounded-lg p-6 border">
                      <h5 className="text-lg font-semibold text-foreground mb-3">
                        For Organizations
                      </h5>
                      <p className="text-muted-foreground text-sm mb-4">
                        Become a contributing node and share your geospatial
                        data with the national infrastructure.
                      </p>
                      <ul className="space-y-2">
                        {[
                          "Data sharing agreements",
                          "Technical capacity building",
                          "Standards compliance support",
                          "Metadata development assistance"
                        ].map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            <span className="text-muted-foreground text-sm">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-card rounded-lg p-6 border">
                      <h5 className="text-lg font-semibold text-foreground mb-3">
                        For Researchers
                      </h5>
                      <p className="text-muted-foreground text-sm mb-4">
                        Access datasets for research, contribute to standards
                        development, and collaborate on innovations.
                      </p>
                      <ul className="space-y-2">
                        {[
                          "Research data access",
                          "Collaborative research opportunities",
                          "Academic partnerships",
                          "Publication and dissemination support"
                        ].map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span className="text-muted-foreground text-sm">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
