"use server"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  MapPin,
  BarChart,
  FileText,
  Info,
  ArrowRight,
  Users,
  Globe,
  Database,
  ChevronRight,
  TreePalm,
  Building
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function LandingPage() {
  // Placeholder data for featured datasets
  const featuredDatasets = [
    {
      id: "1",
      title: "Lagos Metropolitan Area Satellite Imagery",
      description:
        "High-resolution satellite imagery of Lagos, capturing urban development and environmental changes.",
      tags: ["Satellite", "Urban", "Lagos"],
      organization: "Department of Geography",
      date: "Updated Jan 2024",
      imageUrl: "/img/satellite-lagos.jpg" // Local image placeholder
    },
    {
      id: "2",
      title: "Agricultural Land Use in Nigeria",
      description:
        "Detailed mapping of agricultural land use across Nigeria, including crop types and irrigation systems.",
      tags: ["Agriculture", "Land Use", "Mapping"],
      organization: "Agricultural Development Agency",
      date: "Updated Mar 2024",
      imageUrl: "/img/agriculture-nigeria.jpg" // Local image placeholder
    },
    {
      id: "3",
      title: "Geological Survey of the Niger Delta Region",
      description:
        "Comprehensive geological survey data for the Niger Delta, including seismic and well log information.",
      tags: ["Geology", "Niger Delta", "Survey"],
      organization: "Geological Survey Office",
      date: "Updated Jun 2024",
      imageUrl: "/img/niger-delta-geology.jpg" // Local image placeholder
    }
  ]

  // Statistics about the portal (would come from DB in production)
  const portalStats = [
    {
      label: "Datasets Available",
      value: "1,250+",
      icon: Database
    },
    {
      label: "Organizations",
      value: "120+",
      icon: Users
    },
    {
      label: "Data Categories",
      value: "45+",
      icon: Globe
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section - Full width */}
      <div
        className="w-full min-h-[600px] flex flex-col items-center justify-center gap-8 bg-cover bg-center bg-no-repeat p-8 md:p-16"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuASMf-aQ7jV019iVhoGNsolI3FCBsu6dzkQ2gZjowqqsI7i8afawoaTcppzBD6KmqRn45Fqb66Vc5KCERlDl4itd1GOp1ruHgrQhi5inYdwJ9ZPmxQo_WKfIiooUzoOF_loRcDGethVDGcGQaJRDcFM6IsJjCvyRET8X0oR0P2I5JNjYc_7K3DjT_ZmMfpGgVjwGZGvlboJPv_pgaAkTlmjFq-z9OKH7_v8jZK5lpAt5QMaymQEHu7Kyw2iLorKimCqN27g7Ge97Uo")'
        }}
      >
        <div className="flex flex-col gap-4 text-center max-w-3xl">
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em]">
            Explore Nigeria's Geospatial Data
          </h1>
          <h2 className="text-white text-sm md:text-base lg:text-lg font-normal leading-normal max-w-2xl mx-auto">
            Discover, access, and utilize comprehensive geospatial metadata for
            informed decision-making and research across Nigeria.
          </h2>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 space-y-16">
          {/* Featured Datasets Section */}
          <section aria-labelledby="featured-datasets">
            <h2
              id="featured-datasets"
              className="text-3xl font-bold text-center mb-12"
            >
              Featured Datasets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDatasets.map(dataset => (
                <Card
                  key={dataset.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Database className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {dataset.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {dataset.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dataset.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>{dataset.organization}</div>
                      <div>{dataset.date}</div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/metadata/${dataset.id}`} className="w-full">
                      <Button variant="outline" className="w-full group">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* Quick Links Section */}
          <section aria-labelledby="quick-links">
            <h2
              id="quick-links"
              className="text-3xl font-bold text-center mb-12"
            >
              Data Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/metadata/search?category=administrative">
                <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      Administrative Boundaries
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Nigeria's administrative divisions, states, local
                      government areas, and wards.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/metadata/search?category=environment">
                <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Globe className="h-12 w-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors">
                      Environmental Data
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Air quality, water resources, and climate change
                      indicators.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/metadata/search?category=landuse">
                <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <TreePalm className="h-12 w-12 text-emerald-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-600 transition-colors">
                      Land Use and Land Cover
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Vegetation types, urban areas, and protected areas.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/metadata/search?category=infrastructure">
                <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Building className="h-12 w-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      Infrastructure
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Transportation networks, energy infrastructure, and
                      communication systems.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </div>

        {/* Key Features/Info Section */}
        <section
          className="py-16 bg-secondary/30"
          aria-labelledby="portal-features"
        >
          <div className="container mx-auto px-4">
            <h2
              id="portal-features"
              className="mb-12 text-center text-3xl font-bold"
            >
              Portal Features
            </h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="mb-5 rounded-full bg-blue-100 p-5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-semibold group-hover:text-blue-600 transition-colors">
                  Interactive Mapping
                </h3>
                <p className="text-center text-muted-foreground mb-4">
                  Visualize and interact with geospatial data through
                  user-friendly map interfaces.
                </p>
                <Link href="/map">
                  <Button
                    variant="link"
                    className="group-hover:text-blue-700 flex items-center"
                  >
                    <span>Explore Maps</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="mb-5 rounded-full bg-green-100 p-5 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                  <BarChart className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-semibold group-hover:text-green-600 transition-colors">
                  Metadata Standards
                </h3>
                <p className="text-center text-muted-foreground mb-4">
                  Access comprehensive and standardized metadata following NGDI
                  specifications.
                </p>
                <Link href="/metadata/search">
                  <Button
                    variant="link"
                    className="group-hover:text-green-700 flex items-center"
                  >
                    <span>Browse Metadata</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="mb-5 rounded-full bg-amber-100 p-5 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-semibold group-hover:text-amber-600 transition-colors">
                  User Guides
                </h3>
                <p className="text-center text-muted-foreground mb-4">
                  Comprehensive documentation to help you leverage the portal's
                  full capabilities.
                </p>
                <Link href="/docs">
                  <Button
                    variant="link"
                    className="group-hover:text-amber-700 flex items-center"
                  >
                    <span>Read Documentation</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="mb-5 rounded-full bg-purple-100 p-5 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                  <Info className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-semibold group-hover:text-purple-600 transition-colors">
                  About NGDI
                </h3>
                <p className="text-center text-muted-foreground mb-4">
                  Learn about the National Geospatial Data Infrastructure and
                  our mission.
                </p>
                <Link href="/about">
                  <Button
                    variant="link"
                    className="group-hover:text-purple-700 flex items-center"
                  >
                    <span>About the Initiative</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Organizations/Contributors Section */}
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
                The NGDI Portal is made possible by the contributions of
                numerous organizations dedicated to improving access to
                geospatial data.
              </p>
            </div>

            {/* Placeholder for organization logos */}
            <div className="flex flex-wrap justify-center items-center gap-8">
              {[1, 2, 3, 4, 5, 6].map(org => (
                <div
                  key={org}
                  className="h-16 w-32 rounded-md bg-background shadow-sm flex items-center justify-center hover:shadow-md transition-all duration-300 hover:scale-105 border"
                  role="img"
                  aria-label={`Organization ${org} logo placeholder`}
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

        {/* Latest Updates Section */}
        <section
          className="py-16 bg-secondary/50"
          aria-labelledby="latest-updates"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 id="latest-updates" className="text-3xl font-bold">
                Latest Updates
              </h2>
              <Link
                href="/news"
                className="flex items-center text-primary hover:underline"
              >
                View all updates <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "New Climate Data Added",
                  date: "July 12, 2024",
                  excerpt:
                    "The latest climate projections datasets are now available through the NGDI Portal with enhanced visualization options.",
                  tag: "New Data"
                },
                {
                  title: "Portal Performance Improvements",
                  date: "June 28, 2024",
                  excerpt:
                    "We've made significant performance enhancements to the map visualization system for faster rendering of large datasets.",
                  tag: "System Update"
                },
                {
                  title: "Upcoming Workshop: Metadata Creation",
                  date: "June 15, 2024",
                  excerpt:
                    "Join our virtual workshop on best practices for creating high-quality metadata for geospatial datasets.",
                  tag: "Event"
                }
              ].map((update, i) => (
                <Card
                  key={i}
                  className="overflow-hidden hover:shadow-md transition-all group"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {update.tag}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {update.date}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-xl group-hover:text-primary transition-colors">
                      {update.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {update.excerpt}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Link href={`/news/${i + 1}`} className="w-full">
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 group"
                      >
                        Read more
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
