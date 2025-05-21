/*
<ai_context>
This server page returns a simple "About Page" component as a (marketing) route.
</ai_context>
*/

"use server"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// import { Briefcase, Landmark, Users, Lightbulb, ShieldCheck, BookOpen, TrendingUp, Target, Handshake, Brain } from "lucide-react" // Example icons

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-sky-500 to-indigo-600">
        <div className="container mx-auto px-6">
          <div className="inline-block px-3 py-1 mb-4 bg-sky-700/50 text-sky-200 rounded-full text-sm font-medium">
            About Us
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-200">
            About NGDI
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            Creating a unified framework for geospatial data in Nigeria
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-16">
        {/* Introduction Section */}
        <section id="introduction">
          <div className="bg-slate-800/60 rounded-lg p-6 shadow-lg border border-slate-700">
            <p className="text-lg leading-relaxed text-slate-300">
              The National Geo-Spatial Data Infrastructure (NGDI) is a strategic
              initiative aimed at creating a unified framework for geospatial
              data production, management, sharing, and utilization in Nigeria.
              With geospatial information underpinning approximately 80% of
              planning and decision-making processes, the NGDI addresses the
              need for accurate, accessible, and interoperable geospatial
              datasets across all sectors of the economy.
            </p>
          </div>
        </section>

        {/* Tab-based Content */}
        <section id="tabs">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="components">Core Components</TabsTrigger>
              <TabsTrigger value="involved">Get Involved</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-sky-400">
                      Our Vision
                    </h3>
                    <p className="text-lg leading-relaxed text-slate-300">
                      To optimize the use of geospatial data as a critical
                      resource for sustainable development and efficient service
                      delivery.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-sky-400">
                      Our Mission
                    </h3>
                    <p className="text-lg leading-relaxed text-slate-300">
                      To establish institutional, legal, technical, and
                      administrative frameworks for coordinating the production,
                      sharing, and dissemination of standardized geospatial data
                      across all levels of governance in Nigeria.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Objectives Tab */}
            <TabsContent value="objectives">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-sky-400">
                  NGDI Objectives
                </h3>
                <ol className="list-decimal list-inside space-y-4 text-lg text-slate-300">
                  <li>
                    Facilitate collaboration among geospatial data producers,
                    managers, and users
                  </li>
                  <li>
                    Promote standardized data collection and dissemination
                    mechanisms
                  </li>
                  <li>
                    Eliminate duplication in data acquisition and maintenance,
                    improving cost-efficiency
                  </li>
                  <li>
                    Ensure the availability of core datasets to support national
                    planning, disaster management, and economic growth
                  </li>
                  <li>
                    Build capacity and promote research in geospatial
                    technologies
                  </li>
                  <li>
                    Encourage indigenous innovation in geospatial applications
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* Core Components Tab */}
            <TabsContent value="components">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-sky-400">
                  Core Components
                </h3>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Funding
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
                      <li>
                        Annual budgetary allocations from the Federal Government
                        of Nigeria
                      </li>
                      <li>
                        Grants and technical assistance from international
                        development partners
                      </li>
                      <li>
                        Public-private partnerships for sustainable financing of
                        geospatial data infrastructure
                      </li>
                      <li>
                        Cost recovery mechanisms through data services and
                        specialized products
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Governance
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
                      <li>
                        A National NGDI Council chaired by the Vice President of
                        Nigeria provides strategic oversight
                      </li>
                      <li>
                        The Council is supported by a multidisciplinary NGDI
                        Committee comprising representatives from federal
                        ministries, private sectors, academia, and NGOs
                      </li>
                      <li>
                        NASRDA serves as the coordinating agency, ensuring
                        policy implementation and stakeholder engagement
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Data Standards and Interoperability
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
                      <li>
                        Adoption of Open Geospatial Consortium (OGC) standards
                        to ensure data compatibility across systems
                      </li>
                      <li>
                        Development of national geospatial data guidelines for
                        data collection, storage, and sharing
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Metadata and Clearinghouse Services
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
                      <li>
                        Establishment of metadata catalogs and clearing houses
                        to enable data discoverability and easy access
                      </li>
                      <li>
                        Regular updates to metadata to maintain data relevance
                        and usability
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Open Access and Data Security
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
                      <li>
                        Open access policies for non-restricted datasets to
                        encourage innovation
                      </li>
                      <li>
                        Secure systems to protect classified data and ensure
                        intellectual property rights compliance
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Fundamental Datasets
                    </h4>
                    <p className="text-lg text-slate-300 mb-2">
                      Creation and maintenance of core geospatial datasets,
                      including:
                    </p>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 pl-4">
                      <ul className="list-disc list-inside text-slate-300">
                        <li>Administrative boundaries</li>
                        <li>Topography and elevation</li>
                        <li>Land use and land cover</li>
                        <li>Transportation networks</li>
                        <li>Satellite imageries and image maps</li>
                        <li>Hydrological data (rivers, lakes, watersheds)</li>
                        <li>Population demographics and distribution</li>
                      </ul>
                      <ul className="list-disc list-inside text-slate-300">
                        <li>Cadastral information and land registry</li>
                        <li>Infrastructure and utilities networks</li>
                        <li>Soil and geological data</li>
                        <li>Environmental and ecological zones</li>
                        <li>Climate and meteorological data</li>
                        <li>Natural resources and mineral deposits</li>
                        <li>Cultural and heritage sites</li>
                        <li>Emergency management and disaster risk zones</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Capacity Building and Public Awareness
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
                      <li>
                        Training programs for nodal agencies to enhance
                        technical expertise in geospatial data management and
                        analysis
                      </li>
                      <li>
                        Specialized workshops for NGDI Committee members on
                        policy development and implementation strategies
                      </li>
                      <li>
                        Technical skills development for government officials
                        across federal, state, and local levels
                      </li>
                      <li>
                        Academic collaborations to integrate geospatial
                        education into university curricula
                      </li>
                      <li>
                        End-user training sessions for public and private sector
                        stakeholders
                      </li>
                      <li>
                        Public awareness campaigns to highlight the importance
                        of geospatial data in daily life and national
                        development
                      </li>
                      <li>
                        Regular knowledge sharing forums to exchange best
                        practices and innovations in geospatial technologies
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Get Involved Tab */}
            <TabsContent value="involved">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-sky-400">
                  How to Get Involved
                </h3>
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-slate-300">
                    Learn more about how you can contribute to or benefit from
                    the NGDI. We welcome partnerships with government agencies,
                    academic institutions, private sector organizations, and
                    individuals interested in geospatial data and technologies.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 p-5 rounded-lg shadow border border-slate-700 flex flex-col">
                      <h4 className="text-lg font-semibold mb-3 text-sky-300">
                        Contact Us
                      </h4>
                      <p className="text-slate-300 mb-4">
                        Reach out to the NGDI secretariat with inquiries,
                        feedback, or partnership opportunities.
                      </p>
                      <Link
                        href="/contact"
                        className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md shadow-md transition-colors duration-300"
                      >
                        Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>

                    <div className="bg-slate-800 p-5 rounded-lg shadow border border-slate-700 flex flex-col">
                      <h4 className="text-lg font-semibold mb-3 text-sky-300">
                        Publications
                      </h4>
                      <p className="text-slate-300 mb-4">
                        Access our technical papers, guidelines, standards
                        documents, and research publications.
                      </p>
                      <Link
                        href="/publications"
                        className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md shadow-md transition-colors duration-300"
                      >
                        Explore Publications{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>

                    <div className="bg-slate-800 p-5 rounded-lg shadow border border-slate-700 flex flex-col">
                      <h4 className="text-lg font-semibold mb-3 text-sky-300">
                        News & Events
                      </h4>
                      <p className="text-slate-300 mb-4">
                        Stay informed about the latest developments, upcoming
                        workshops, conferences, and training opportunities.
                      </p>
                      <Link
                        href="/news"
                        className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md shadow-md transition-colors duration-300"
                      >
                        Latest News <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
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
