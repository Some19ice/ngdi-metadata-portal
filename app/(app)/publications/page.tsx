/*
<ai_context>
This server page returns an enhanced "Publications Page" component with improved layout, animations, interactive elements, and better visual hierarchy.
</ai_context>
*/

"use server"

import Link from "next/link"
import {
  BookOpen,
  Download,
  Search,
  Filter,
  Calendar,
  FileText,
  Award,
  TrendingUp,
  ArrowRight,
  Eye,
  Tag
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Enhanced publications data with more details
const publications = [
  {
    id: "1",
    title: "National Geospatial Data Policy 2023",
    category: "Policy",
    date: "2023-03-15",
    summary:
      "The official policy document outlining the framework for geospatial data management and dissemination in the nation.",
    fileUrl: "/docs/NGDI_National_Geospatial_Data_Policy_2023.pdf",
    keywords: ["policy", "framework", "official document"],
    fileSize: "2.4 MB",
    downloads: 1250,
    featured: true,
    author: "NGDI Committee",
    pages: 45
  },
  {
    id: "2",
    title: "NGDI Metadata Standard - Version 2.1",
    category: "Standard",
    date: "2023-06-20",
    summary:
      "Defines the standard for metadata creation and management within the NGDI framework, ensuring interoperability and quality.",
    fileUrl: "/docs/NGDI_Metadata_Standard_v2.1.pdf",
    keywords: ["metadata", "standard", "technical specification", "ISO 19115"],
    fileSize: "1.8 MB",
    downloads: 890,
    featured: true,
    author: "Technical Working Group",
    pages: 32
  },
  {
    id: "3",
    title: "Annual Report: The State of Geospatial Infrastructure 2022",
    category: "Report",
    date: "2023-01-30",
    summary:
      "A comprehensive report on the progress, challenges, and future outlook of the national geospatial infrastructure.",
    fileUrl: "/docs/NGDI_Annual_Report_2022.pdf",
    keywords: ["annual report", "progress", "assessment"],
    fileSize: "5.2 MB",
    downloads: 2100,
    featured: false,
    author: "NASRDA",
    pages: 78
  },
  {
    id: "4",
    title: "Guidelines for Data Contribution to NGDI",
    category: "Guideline",
    date: "2022-11-05",
    summary:
      "Practical guidelines for organizations and individuals wishing to contribute geospatial data to the NGDI portal.",
    fileUrl: "/docs/NGDI_Data_Contribution_Guidelines.pdf",
    keywords: ["contribution", "data sharing", "guideline"],
    fileSize: "1.2 MB",
    downloads: 675,
    featured: false,
    author: "Data Management Team",
    pages: 24
  },
  {
    id: "5",
    title: "Case Study: Geospatial Data for Urban Planning in Lagos",
    category: "Case Study",
    date: "2023-09-10",
    summary:
      "An in-depth case study showcasing the application and benefits of NGDI-aligned geospatial data in urban development projects.",
    fileUrl: "/docs/NGDI_Case_Study_Lagos_Urban_Planning.pdf",
    keywords: ["case study", "urban planning", "application", "Lagos"],
    fileSize: "3.7 MB",
    downloads: 445,
    featured: true,
    author: "Urban Planning Consortium",
    pages: 56
  },
  {
    id: "6",
    title: "Best Practices for Geospatial Data Quality Assurance",
    category: "Guideline",
    date: "2023-08-15",
    summary:
      "Comprehensive guidelines for ensuring data quality and accuracy in geospatial datasets within the NGDI framework.",
    fileUrl: "/docs/NGDI_Quality_Assurance_Guidelines.pdf",
    keywords: ["quality assurance", "best practices", "data validation"],
    fileSize: "2.1 MB",
    downloads: 320,
    featured: false,
    author: "Quality Assurance Team",
    pages: 38
  }
]

// Statistics for publications
const publicationStats = [
  {
    id: 1,
    label: "Total Publications",
    value: "25+",
    icon: BookOpen,
    description: "Documents, reports, and guidelines available"
  },
  {
    id: 2,
    label: "Total Downloads",
    value: "15K+",
    icon: Download,
    description: "Downloads across all publications"
  },
  {
    id: 3,
    label: "Categories",
    value: "5",
    icon: Tag,
    description: "Different types of publications"
  },
  {
    id: 4,
    label: "Latest Update",
    value: "2023",
    icon: Calendar,
    description: "Most recent publication year"
  }
]

// Categories with colors
const categories = [
  { name: "All", color: "slate" },
  { name: "Policy", color: "emerald" },
  { name: "Standard", color: "blue" },
  { name: "Report", color: "purple" },
  { name: "Guideline", color: "amber" },
  { name: "Case Study", color: "rose" }
]

export default async function PublicationsPage() {
  // Get featured publications
  const featuredPublications = publications.filter(pub => pub.featured)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-10 text-center bg-gradient-success relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="inline-block px-4 py-2 mb-6 bg-success-light/50 text-success-foreground rounded-full text-sm font-medium backdrop-blur-sm border border-success/30">
            <BookOpen className="inline w-4 h-4 mr-2" />
            Publications
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-md text-success-foreground mb-6">
            NGDI Publications
          </h1>
          <p className="mt-6 text-xl leading-8 text-success-foreground/90 drop-shadow-sm max-w-3xl mx-auto">
            Access key documents, reports, standards, and guidelines related to
            the National Geospatial Data Infrastructure
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {publicationStats.map(stat => {
              const IconComponent = stat.icon
              return (
                <div
                  key={stat.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <IconComponent className="w-8 h-8 text-success-foreground/80 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-2xl font-bold text-success-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-success-foreground/80">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-20">
        {/* Featured Publications */}
        <section id="featured">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-semibold mb-8 text-success text-center flex items-center justify-center">
                <Award className="w-8 h-8 mr-3" />
                Featured Publications
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPublications.map(pub => (
                  <div
                    key={pub.id}
                    className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 group relative"
                  >
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-success text-success-foreground">
                        Featured
                      </Badge>
                    </div>

                    <div className="flex items-center text-success mb-3">
                      <FileText className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">
                        {pub.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-3 text-foreground group-hover:text-success transition-colors line-clamp-2">
                      {pub.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {pub.summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(pub.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        {pub.downloads} downloads
                      </div>
                    </div>

                    <Link
                      href={pub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-success hover:bg-success/90 text-success-foreground font-medium rounded-lg shadow-sm transition-colors duration-300 text-sm group"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Publication
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section id="search-filter">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <h2 className="text-2xl font-semibold mb-6 text-success flex items-center">
              <Search className="w-6 h-6 mr-3" />
              Find Publications
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Search by title, keyword, or author
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-300"
                    placeholder="Search publications..."
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Filter by category
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <select
                    id="category"
                    name="category"
                    className="block w-full pl-10 pr-8 py-3 border border-input rounded-lg leading-5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-300"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      All Categories
                    </option>
                    {categories.slice(1).map(category => (
                      <option
                        key={category.name}
                        value={category.name.toLowerCase()}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Category Tags */}
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground mb-3">
                Quick filters:
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.name}
                    className="px-3 py-1 text-sm rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Publications List Section */}
        <section id="publications-list">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <h2 className="text-2xl font-semibold mb-8 text-success flex items-center">
              <BookOpen className="w-6 h-6 mr-3" />
              All Publications
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.map(pub => (
                <div
                  key={pub.id}
                  className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-success">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">
                          {pub.category}
                        </span>
                      </div>
                      {pub.featured && (
                        <Badge variant="outline" className="text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-success transition-colors line-clamp-2">
                      {pub.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-2">
                      By {pub.author} • {pub.pages} pages
                    </p>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {pub.summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(pub.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        {pub.downloads}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {pub.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="flex gap-2">
                      <Link
                        href={pub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-success hover:bg-success/90 text-success-foreground font-medium rounded-lg shadow-sm transition-colors duration-300 text-sm group"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Link>
                      <button className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors duration-300">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {pub.fileSize}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section id="contribute">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <div className="max-w-4xl mx-auto text-center">
              <div className="p-4 bg-success/10 rounded-full w-fit mx-auto mb-6">
                <TrendingUp className="h-12 w-12 text-success" />
              </div>
              <h2 className="text-3xl font-semibold mb-6 text-success">
                Have a Publication to Share?
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8 max-w-2xl mx-auto">
                If your organization has relevant publications, reports, or
                standards that would benefit the NGDI community, we'd love to
                hear from you. Help us build a comprehensive knowledge base.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-8 py-3 bg-success hover:bg-success/90 text-success-foreground font-semibold rounded-lg shadow-md transition-colors duration-300 group"
                >
                  Contact Us to Contribute
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center px-8 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg shadow-md transition-colors duration-300 group"
                >
                  Learn More About NGDI
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
