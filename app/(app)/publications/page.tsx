"use server"

import Link from "next/link"
import { BookOpen, Download, Search } from "lucide-react"

// Placeholder data for publications - replace with actual data fetching
const publications = [
  {
    id: "1",
    title: "National Geospatial Data Policy 2023",
    category: "Policy",
    date: "2023-03-15",
    summary:
      "The official policy document outlining the framework for geospatial data management and dissemination in the nation.",
    fileUrl: "/docs/NGDI_National_Geospatial_Data_Policy_2023.pdf",
    keywords: ["policy", "framework", "official document"]
  },
  {
    id: "2",
    title: "NGDI Metadata Standard - Version 2.1",
    category: "Standard",
    date: "2023-06-20",
    summary:
      "Defines the standard for metadata creation and management within the NGDI framework, ensuring interoperability and quality.",
    fileUrl: "/docs/NGDI_Metadata_Standard_v2.1.pdf",
    keywords: ["metadata", "standard", "technical specification", "ISO 19115"]
  },
  {
    id: "3",
    title: "Annual Report: The State of Geospatial Infrastructure 2022",
    category: "Report",
    date: "2023-01-30",
    summary:
      "A comprehensive report on the progress, challenges, and future outlook of the national geospatial infrastructure.",
    fileUrl: "/docs/NGDI_Annual_Report_2022.pdf",
    keywords: ["annual report", "progress", "assessment"]
  },
  {
    id: "4",
    title: "Guidelines for Data Contribution to NGDI",
    category: "Guideline",
    date: "2022-11-05",
    summary:
      "Practical guidelines for organizations and individuals wishing to contribute geospatial data to the NGDI portal.",
    fileUrl: "/docs/NGDI_Data_Contribution_Guidelines.pdf",
    keywords: ["contribution", "data sharing", "guideline"]
  },
  {
    id: "5",
    title: "Case Study: Geospatial Data for Urban Planning in Lagos",
    category: "Case Study",
    date: "2023-09-10",
    summary:
      "An in-depth case study showcasing the application and benefits of NGDI-aligned geospatial data in urban development projects.",
    fileUrl: "/docs/NGDI_Case_Study_Lagos_Urban_Planning.pdf",
    keywords: ["case study", "urban planning", "application", "Lagos"]
  }
]

// TODO: Implement actual search and filtering logic
// TODO: Add pagination if the list becomes long

export default async function PublicationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-emerald-500 to-green-600">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md">
            NGDI Publications
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            Access key documents, reports, standards, and guidelines related to
            the National Geospatial Data Infrastructure.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-12">
        {/* Search and Filter Section - Placeholder */}
        <section
          id="search-filter"
          className="p-6 bg-slate-800 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">
            Find Publications
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">
                Search publications
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="search"
                  name="search"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-700 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Search by title, keyword..."
                />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="sr-only">
                Filter by category
              </label>
              <select
                id="category"
                name="category"
                className="block w-full pl-3 pr-10 py-2 border border-slate-700 rounded-md leading-5 bg-slate-700 text-slate-50 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Filter by Category
                </option>
                <option value="policy">Policy</option>
                <option value="standard">Standard</option>
                <option value="report">Report</option>
                <option value="guideline">Guideline</option>
                <option value="case-study">Case Study</option>
                <option value="all">All Categories</option>
              </select>
            </div>
          </div>
        </section>

        {/* Publications List Section */}
        <section id="publications-list">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publications.map(pub => (
              <div
                key={pub.id}
                className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-emerald-500/30 transition-shadow duration-300"
              >
                <div className="p-6 flex-grow">
                  <div className="flex items-center text-emerald-400 mb-2">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">{pub.category}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-100 hover:text-emerald-400 transition-colors">
                    <Link
                      href={pub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pub.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-slate-400 mb-1">
                    Published: {new Date(pub.date).toLocaleDateString()}
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3 flex-grow">
                    {pub.summary}
                  </p>
                  <div className="text-xs text-slate-500">
                    Keywords: {pub.keywords.join(", ")}
                  </div>
                </div>
                <div className="p-6 bg-slate-700/50 border-t border-slate-700">
                  <Link
                    href={pub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-300 text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download / View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action / Contribution Section - Placeholder */}
        <section id="contribute" className="text-center py-12">
          <h2 className="text-3xl font-semibold mb-4 text-emerald-400">
            Have a Publication to Share?
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            If your organization has relevant publications, reports, or
            standards that would benefit the NGDI community, please get in touch
            with us.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
          >
            Contact Us to Contribute
          </Link>
        </section>
      </div>
    </div>
  )
}
