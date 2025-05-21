"use server"

import Link from "next/link"
import {
  Users,
  Building,
  GraduationCap,
  MapPin,
  Briefcase,
  LandPlot
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import NgdiArchitecturePlaceholder from "@/public/img/ngdi-architecture-placeholder"

// Placeholder data for committee members - replace with actual data
const committeeMembers = [
  {
    id: "1",
    name: "Dr. Amina Bello",
    role: "Chairperson",
    affiliation: "Federal Ministry of Science and Technology",
    imageUrl: "/placeholders/avatar-female-1.jpg", // Replace with actual image path
    bioSnippet:
      "Dr. Bello is a leading expert in geospatial policy and has been instrumental in shaping national strategies for data infrastructure.",
    expertise: ["Geospatial Policy", "National Strategy", "Data Governance"]
  },
  {
    id: "2",
    name: "Engr. Chinedu Okoro",
    role: "Vice-Chairperson",
    affiliation: "National Space Research and Development Agency (NASRDA)",
    imageUrl: "/placeholders/avatar-male-1.jpg", // Replace with actual image path
    bioSnippet:
      "Engr. Okoro brings extensive experience in satellite imagery analysis and its application in environmental monitoring.",
    expertise: ["Satellite Imagery", "Remote Sensing", "Environmental Science"]
  },
  {
    id: "3",
    name: "Prof. Funke Adeyemi",
    role: "Secretary",
    affiliation: "University of Lagos, Department of Geography",
    imageUrl: "/placeholders/avatar-female-2.jpg", // Replace with actual image path
    bioSnippet:
      "Prof. Adeyemi is a renowned academic with a focus on urban planning and GIS applications for sustainable development.",
    expertise: ["Urban Planning", "GIS Applications", "Sustainable Development"]
  },
  {
    id: "4",
    name: "Mr. Ibrahim Musa",
    role: "Member",
    affiliation: "Office of the Surveyor-General of the Federation (OSGOF)",
    imageUrl: "/placeholders/avatar-male-2.jpg", // Replace with actual image path
    bioSnippet:
      "Mr. Musa specializes in cadastral mapping and land information systems, ensuring foundational data accuracy.",
    expertise: ["Cadastral Mapping", "Land Information Systems", "Surveying"]
  },
  {
    id: "5",
    name: "Ms. Zainab Aliyu",
    role: "Member",
    affiliation: "Nigerian Communications Commission (NCC)",
    imageUrl: "/placeholders/avatar-female-3.jpg", // Replace with actual image path
    bioSnippet:
      "Ms. Aliyu focuses on the intersection of telecommunications infrastructure and geospatial data for national planning.",
    expertise: ["Telecoms Infrastructure", "Data Integration", "ICT Policy"]
  }
  // Add more members as needed
]

export default async function CommitteePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-sky-500 to-indigo-600">
        <div className="container mx-auto px-6">
          <div className="inline-block px-3 py-1 mb-4 bg-sky-700/50 text-sky-200 rounded-full text-sm font-medium">
            Governance
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-200">
            NGDI Committee
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            Coordinating geospatial activities across Nigeria
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-16">
        {/* Introduction Section */}
        <section id="introduction">
          <div className="bg-slate-800/60 rounded-lg p-6 shadow-lg border border-slate-700">
            <p className="text-lg leading-relaxed text-slate-300">
              The NGDI committee, with its secretariat hosted by NASRDA
              (National Space Research and Development Agency), is a
              multidisciplinary body responsible for overseeing Nigeria's
              Geo-Spatial Data Infrastructure. The committee coordinates
              geospatial activities across different sectors and ensures
              alignment with national objectives.
            </p>
          </div>
        </section>

        {/* Tab-based Content */}
        <section id="tabs">
          <Tabs defaultValue="structure" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="composition">Composition</TabsTrigger>
              <TabsTrigger value="responsibilities">
                Responsibilities
              </TabsTrigger>
            </TabsList>

            {/* Structure Tab */}
            <TabsContent value="structure" className="space-y-6">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 text-sky-400">
                  Committee Structure
                </h3>
                <p className="text-lg leading-relaxed text-slate-300 mb-6">
                  The NGDI committee consists of 27 members representing various
                  stakeholders in the geospatial sector. The chairman is
                  selected on a rotational basis and can serve for a maximum of
                  two consecutive one-year terms.
                </p>

                <h4 className="text-xl font-semibold mb-4 text-sky-300">
                  Committee Composition
                </h4>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col items-center text-center">
                    <div className="p-3 bg-sky-900/40 rounded-full mb-3">
                      <Building className="h-8 w-8 text-sky-400" />
                    </div>
                    <h5 className="text-xl font-semibold mb-2 text-slate-100">
                      Government
                    </h5>
                    <p className="text-3xl font-bold text-sky-500">11</p>
                    <p className="text-slate-400">Agencies</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col items-center text-center">
                    <div className="p-3 bg-sky-900/40 rounded-full mb-3">
                      <GraduationCap className="h-8 w-8 text-sky-400" />
                    </div>
                    <h5 className="text-xl font-semibold mb-2 text-slate-100">
                      Academia
                    </h5>
                    <p className="text-3xl font-bold text-sky-500">4</p>
                    <p className="text-slate-400">Institutions</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col items-center text-center">
                    <div className="p-3 bg-sky-900/40 rounded-full mb-3">
                      <Briefcase className="h-8 w-8 text-sky-400" />
                    </div>
                    <h5 className="text-xl font-semibold mb-2 text-slate-100">
                      Private Sector
                    </h5>
                    <p className="text-3xl font-bold text-sky-500">4</p>
                    <p className="text-slate-400">Organizations</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Composition Tab */}
            <TabsContent value="composition">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-sky-400">
                  Committee Composition
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-800 p-5 rounded-lg shadow">
                      <h4 className="text-xl font-semibold mb-3 text-sky-300">
                        Coordinating Agency
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                        <li>
                          Two NASRDA representatives at directorate level or
                          equivalent
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-800 p-5 rounded-lg shadow">
                      <h4 className="text-xl font-semibold mb-3 text-sky-300">
                        Academic Institutions
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                        <li>
                          Two senior lecturers from universities (selected in
                          rotation)
                        </li>
                        <li>
                          Two principal lecturers from polytechnics/monotechnics
                          (selected in rotation)
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-800 p-5 rounded-lg shadow">
                      <h4 className="text-xl font-semibold mb-3 text-sky-300">
                        Geopolitical Representation
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                        <li>
                          Six representatives from state nodal agencies across
                          Nigeria's geopolitical zones
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-800 p-5 rounded-lg shadow">
                      <h4 className="text-xl font-semibold mb-3 text-sky-300">
                        Private Sector & NGOs
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                        <li>
                          Four representatives from GI-related private sector,
                          inter-governmental and non-governmental organizations
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-800 p-5 rounded-lg shadow">
                      <h4 className="text-xl font-semibold mb-3 text-sky-300">
                        Federal Ministries and Agencies
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                        <li>Ministry of Defense (Armed Forces)</li>
                        <li>
                          Office of the Surveyor-General of the Federation
                        </li>
                        <li>Ministry of Agriculture and Water Resources</li>
                        <li>Ministry of Mines and Steel Development</li>
                        <li>National Planning Commission</li>
                        <li>Federal Capital Development Authority</li>
                        <li>Nigeria National Petroleum Corporation</li>
                        <li>Ministry of Environment and Housing</li>
                        <li>Ministry of Transport</li>
                        <li>Ministry of Finance</li>
                        <li>National Population Commission</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Responsibilities Tab */}
            <TabsContent value="responsibilities">
              <div className="bg-slate-800/40 rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-sky-400">
                  Committee Responsibilities
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Policy Development
                    </h4>
                    <p className="text-slate-300">
                      Development of policies and guidelines for geospatial data
                      management
                    </p>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Coordination
                    </h4>
                    <p className="text-slate-300">
                      Coordination of geospatial activities across different
                      sectors
                    </p>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Standards Promotion
                    </h4>
                    <p className="text-slate-300">
                      Promotion of standards and best practices
                    </p>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Capacity Building
                    </h4>
                    <p className="text-slate-300">
                      Oversight of capacity building initiatives
                    </p>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
                    <h4 className="text-xl font-semibold mb-3 text-sky-300">
                      Monitoring
                    </h4>
                    <p className="text-slate-300">
                      Monitoring and evaluation of NGDI implementation
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* NGDI Technical Framework Section */}
        <section id="technical-framework">
          <h2 className="text-4xl font-semibold mb-6 text-sky-400">
            NGDI Technical Framework
          </h2>
          <p className="text-lg leading-relaxed text-slate-300 mb-6">
            The NGDI technical framework establishes the architecture for
            geospatial data sharing and collaboration across Nigeria. It enables
            efficient data discovery, access, and integration while ensuring
            interoperability between different systems.
          </p>

          <div className="bg-slate-800/60 rounded-lg p-6 shadow-lg border border-slate-700">
            <div className="w-full aspect-video relative overflow-hidden rounded-lg mb-4">
              <div className="flex items-center justify-center bg-slate-700 w-full h-full">
                {/* Replace with actual image when available */}
                {/* <LandPlot className="h-24 w-24 text-sky-400 opacity-50" /> */}
                <NgdiArchitecturePlaceholder className="w-full h-auto" />
              </div>
            </div>
            <p className="text-center text-slate-400 text-sm">
              Figure 2: Nigerian NGDI Technical Framework - Architecture for
              geospatial data sharing and management
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact-committee">
          <h2 className="text-4xl font-semibold mb-6 text-sky-400">
            Get Involved
          </h2>
          <p className="text-lg leading-relaxed text-slate-300 mb-6">
            Learn more about the NGDI Committee's work or get in touch with the
            secretariat.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
            >
              Contact the Secretariat
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
            >
              About NGDI
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
