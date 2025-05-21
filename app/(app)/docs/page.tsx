"use server"

import Link from "next/link"
import {
  BookOpen,
  Search,
  ChevronRight,
  FileText,
  Users,
  ShieldCheck,
  Settings
} from "lucide-react"

// Placeholder data for documentation categories and articles
const docCategories = [
  {
    id: "getting-started",
    name: "Getting Started",
    description:
      "Learn the basics of the NGDI Portal and how to navigate its features.",
    icon: <FileText className="h-8 w-8 text-blue-400" />,
    articles: [
      {
        id: "intro",
        title: "Introduction to the NGDI Portal",
        link: "/docs/getting-started/introduction"
      },
      {
        id: "account",
        title: "Creating and Managing Your Account",
        link: "/docs/getting-started/account-management"
      },
      {
        id: "navigation",
        title: "Navigating the Portal Interface",
        link: "/docs/getting-started/portal-navigation"
      }
    ]
  },
  {
    id: "metadata-management",
    name: "Metadata Management",
    description:
      "Guides for creating, submitting, and managing metadata records.",
    icon: <BookOpen className="h-8 w-8 text-blue-400" />,
    articles: [
      {
        id: "creating",
        title: "Creating New Metadata Records",
        link: "/docs/metadata/creating-records"
      },
      {
        id: "standards",
        title: "Understanding Metadata Standards",
        link: "/docs/metadata/standards-overview"
      },
      {
        id: "workflow",
        title: "The Metadata Approval Workflow",
        link: "/docs/metadata/approval-workflow"
      },
      {
        id: "my-metadata",
        title: "Using the 'My Metadata' Dashboard",
        link: "/docs/metadata/my-metadata-dashboard"
      }
    ]
  },
  {
    id: "search-discovery",
    name: "Search & Discovery",
    description: "How to find and utilize geospatial data through the portal.",
    icon: <Search className="h-8 w-8 text-blue-400" />,
    articles: [
      {
        id: "keyword-search",
        title: "Using Keyword Search",
        link: "/docs/search/keyword-search"
      },
      {
        id: "faceted-search",
        title: "Advanced Filtering with Facets",
        link: "/docs/search/faceted-search"
      },
      {
        id: "spatial-search",
        title: "Performing Spatial Searches",
        link: "/docs/search/spatial-search"
      }
    ]
  },
  {
    id: "user-roles",
    name: "User Roles & Permissions",
    description: "Understanding different user roles and their capabilities.",
    icon: <Users className="h-8 w-8 text-blue-400" />,
    articles: [
      {
        id: "roles-overview",
        title: "Overview of User Roles",
        link: "/docs/users/roles-overview"
      },
      {
        id: "node-officer",
        title: "Guide for Node Officers",
        link: "/docs/users/node-officer-guide"
      },
      {
        id: "admin-guide",
        title: "Administrator Guide",
        link: "/docs/users/admin-guide"
      }
    ]
  },
  {
    id: "security-privacy",
    name: "Security & Privacy",
    description:
      "Information about data security, privacy policies, and terms of use.",
    icon: <ShieldCheck className="h-8 w-8 text-blue-400" />,
    articles: [
      {
        id: "security-measures",
        title: "Our Security Measures",
        link: "/docs/security/security-measures"
      },
      { id: "privacy-policy", title: "Privacy Policy", link: "/privacy" }, // Link to existing privacy page
      { id: "terms-of-service", title: "Terms of Service", link: "/terms" } // Link to existing terms page
    ]
  },
  {
    id: "api-developers",
    name: "API & Developer Resources",
    description:
      "Guides for developers on using the NGDI Portal API (if applicable).",
    icon: <Settings className="h-8 w-8 text-blue-400" />,
    articles: [
      {
        id: "api-intro",
        title: "Introduction to the API",
        link: "/docs/api/introduction"
      },
      {
        id: "auth",
        title: "API Authentication",
        link: "/docs/api/authentication"
      },
      {
        id: "endpoints",
        title: "Available API Endpoints",
        link: "/docs/api/endpoints"
      }
    ]
  }
  // Add more categories as needed
]

export default async function DocsPage() {
  // In a real app, you might fetch categories and filter articles based on searchParams.query
  // const searchQuery = searchParams?.query || "";
  // const filteredCategories = docCategories.map(category => ({
  //   ...category,
  //   articles: category.articles.filter(article =>
  //     article.title.toLowerCase().includes(searchQuery.toLowerCase())
  //   )
  // })).filter(category => category.articles.length > 0);

  const displayedCategories = docCategories // Using placeholder, no filtering applied yet

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="container mx-auto px-6">
          <BookOpen className="mx-auto h-16 w-16 text-white drop-shadow-md mb-4" />
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md">
            NGDI Portal Documentation
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            Find guides, tutorials, and resources to help you make the most of
            the National Geospatial Data Infrastructure portal.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        {/* Search Bar (Placeholder) */}
        <div className="mb-12 max-w-2xl mx-auto">
          <label htmlFor="search-docs" className="sr-only">
            Search documentation
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="search-docs"
              name="search-docs"
              // value={searchQuery}
              // onChange={(e) => router.push(\"`?query=${e.target.value}`\")}
              className="block w-full bg-slate-700 border border-slate-600 rounded-md py-3 pl-10 pr-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search documentation (e.g., 'how to create metadata')"
              type="search"
            />
          </div>
        </div>

        {/* Documentation Categories */}
        <div className="space-y-12">
          {displayedCategories.map(category => (
            <section key={category.id} id={category.id}>
              <div className="flex items-center mb-4">
                {category.icon}
                <h2 className="text-3xl font-semibold ml-3 text-blue-300">
                  {category.name}
                </h2>
              </div>
              <p className="text-slate-400 mb-6 ml-11">
                {category.description}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 ml-11">
                {category.articles.map(article => (
                  <Link
                    href={article.link}
                    key={article.id}
                    className="block p-6 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-700/70 hover:shadow-blue-500/30 transition-all duration-300 group" // Added group for hover effects
                  >
                    <h3 className="text-lg font-medium text-slate-100 mb-1 group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>
                    {/* Optional: add a short description for each article here */}
                    <div className="mt-3 text-blue-400 group-hover:text-blue-300 inline-flex items-center text-sm transition-colors">
                      Read Article
                      <ChevronRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {displayedCategories.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-slate-300 mb-2">
              No Documentation Found
            </h3>
            <p className="text-slate-400">
              Your search did not match any documentation. Please try different
              keywords or browse the categories.
            </p>
          </div>
        )}

        {/* Call to action / Further help */}
        <section className="mt-20 text-center py-12 bg-slate-800/50 rounded-lg">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            If you have specific questions or need further assistance, don't
            hesitate to reach out to our support team.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
          >
            Contact Support
          </Link>
        </section>
      </div>
    </div>
  )
}
