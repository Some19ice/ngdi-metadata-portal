"use server"

import Link from "next/link"
import {
  Users,
  Building,
  GraduationCap,
  MapPin,
  Briefcase,
  LandPlot,
  Mail,
  Phone,
  Target,
  Shield,
  Globe,
  ArrowRight
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import NgdiArchitecturePlaceholder from "@/public/img/ngdi-architecture-placeholder"

// Enhanced committee members data with more details
const committeeMembers = [
  {
    id: "1",
    name: "Dr. Amina Bello",
    role: "Chairperson",
    affiliation: "Federal Ministry of Science and Technology",
    imageUrl: "/placeholders/avatar-female-1.jpg",
    bioSnippet:
      "Dr. Bello is a leading expert in geospatial policy and has been instrumental in shaping national strategies for data infrastructure.",
    expertise: ["Geospatial Policy", "National Strategy", "Data Governance"],
    email: "a.bello@fmst.gov.ng",
    phone: "+234 803 123 4567"
  },
  {
    id: "2",
    name: "Engr. Chinedu Okoro",
    role: "Vice-Chairperson",
    affiliation: "National Space Research and Development Agency (NASRDA)",
    imageUrl: "/placeholders/avatar-male-1.jpg",
    bioSnippet:
      "Engr. Okoro brings extensive experience in satellite imagery analysis and its application in environmental monitoring.",
    expertise: ["Satellite Imagery", "Remote Sensing", "Environmental Science"],
    email: "c.okoro@nasrda.gov.ng",
    phone: "+234 806 234 5678"
  },
  {
    id: "3",
    name: "Prof. Funke Adeyemi",
    role: "Secretary",
    affiliation: "University of Lagos, Department of Geography",
    imageUrl: "/placeholders/avatar-female-2.jpg",
    bioSnippet:
      "Prof. Adeyemi is a renowned academic with a focus on urban planning and GIS applications for sustainable development.",
    expertise: [
      "Urban Planning",
      "GIS Applications",
      "Sustainable Development"
    ],
    email: "f.adeyemi@unilag.edu.ng",
    phone: "+234 809 345 6789"
  },
  {
    id: "4",
    name: "Mr. Ibrahim Musa",
    role: "Member",
    affiliation: "Office of the Surveyor-General of the Federation (OSGOF)",
    imageUrl: "/placeholders/avatar-male-2.jpg",
    bioSnippet:
      "Mr. Musa specializes in cadastral mapping and land information systems, ensuring foundational data accuracy.",
    expertise: ["Cadastral Mapping", "Land Information Systems", "Surveying"],
    email: "i.musa@osgof.gov.ng",
    phone: "+234 812 456 7890"
  },
  {
    id: "5",
    name: "Ms. Zainab Aliyu",
    role: "Member",
    affiliation: "Nigerian Communications Commission (NCC)",
    imageUrl: "/placeholders/avatar-female-3.jpg",
    bioSnippet:
      "Ms. Aliyu focuses on the intersection of telecommunications infrastructure and geospatial data for national planning.",
    expertise: ["Telecoms Infrastructure", "Data Integration", "ICT Policy"],
    email: "z.aliyu@ncc.gov.ng",
    phone: "+234 815 567 8901"
  }
]

// Statistics for the committee
const committeeStats = [
  {
    id: 1,
    label: "Total Members",
    value: "27",
    icon: Users,
    description: "Multidisciplinary experts from various sectors"
  },
  {
    id: 2,
    label: "Government Agencies",
    value: "11",
    icon: Building,
    description: "Federal ministries and agencies represented"
  },
  {
    id: 3,
    label: "Academic Institutions",
    value: "4",
    icon: GraduationCap,
    description: "Universities and polytechnics involved"
  },
  {
    id: 4,
    label: "Private Sector",
    value: "4",
    icon: Briefcase,
    description: "Private organizations and NGOs"
  }
]

export default async function CommitteePage() {
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
            <Users className="inline w-4 h-4 mr-2" />
            Governance
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-md text-primary-foreground mb-6">
            NGDI Committee
          </h1>
          <p className="mt-6 text-xl leading-8 text-primary-foreground/90 drop-shadow-sm max-w-3xl mx-auto">
            Coordinating geospatial activities across Nigeria through
            multidisciplinary expertise and strategic oversight
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {committeeStats.map(stat => {
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
        {/* Introduction Section */}
        <section id="introduction">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-semibold mb-6 text-foreground text-center">
                About the NGDI Committee
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground text-center">
                The NGDI committee, with its secretariat hosted by NASRDA
                (National Space Research and Development Agency), is a
                multidisciplinary body responsible for overseeing Nigeria's
                Geo-Spatial Data Infrastructure. The committee coordinates
                geospatial activities across different sectors and ensures
                alignment with national objectives.
              </p>
            </div>
          </div>
        </section>

        {/* Tab-based Content */}
        <section id="tabs">
          <Tabs defaultValue="structure" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-4 w-full max-w-3xl">
                <TabsTrigger value="structure" className="text-sm">
                  Structure
                </TabsTrigger>
                <TabsTrigger value="composition" className="text-sm">
                  Composition
                </TabsTrigger>
                <TabsTrigger value="responsibilities" className="text-sm">
                  Responsibilities
                </TabsTrigger>
                <TabsTrigger value="members" className="text-sm">
                  Key Members
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Structure Tab */}
            <TabsContent value="structure">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  Committee Structure
                </h3>
                <p className="text-lg leading-relaxed text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
                  The NGDI committee consists of 27 members representing various
                  stakeholders in the geospatial sector. The chairman is
                  selected on a rotational basis and can serve for a maximum of
                  two consecutive one-year terms.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Government Agencies",
                      count: "11",
                      icon: Building,
                      color: "success",
                      description: "Federal ministries and agencies"
                    },
                    {
                      title: "Academic Institutions",
                      count: "4",
                      icon: GraduationCap,
                      color: "primary",
                      description: "Universities and polytechnics"
                    },
                    {
                      title: "Private Sector",
                      count: "4",
                      icon: Briefcase,
                      color: "info",
                      description: "Private organizations and NGOs"
                    },
                    {
                      title: "Geopolitical Zones",
                      count: "6",
                      icon: MapPin,
                      color: "warning",
                      description: "State nodal agencies representation"
                    }
                  ].map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <div
                        key={index}
                        className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300 group text-center"
                      >
                        <div className="p-3 bg-primary/10 rounded-lg mx-auto mb-4 w-fit group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="text-xl font-semibold text-foreground mb-2">
                          {item.title}
                        </h4>
                        <div className="text-3xl font-bold text-primary mb-2">
                          {item.count}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {item.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Composition Tab */}
            <TabsContent value="composition">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  Committee Composition
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300">
                      <h4 className="text-xl font-semibold mb-4 text-success flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        Coordinating Agency
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">
                            Two NASRDA representatives at directorate level or
                            equivalent
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300">
                      <h4 className="text-xl font-semibold mb-4 text-primary flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Academic Institutions
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">
                            Two senior lecturers from universities (selected in
                            rotation)
                          </span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">
                            Two principal lecturers from
                            polytechnics/monotechnics (selected in rotation)
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300">
                      <h4 className="text-xl font-semibold mb-4 text-info flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Geopolitical Representation
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-info mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">
                            Six representatives from state nodal agencies across
                            Nigeria's geopolitical zones
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300">
                      <h4 className="text-xl font-semibold mb-4 text-warning flex items-center">
                        <Briefcase className="w-5 h-5 mr-2" />
                        Private Sector & NGOs
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">
                            Four representatives from GI-related private sector,
                            inter-governmental and non-governmental
                            organizations
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300">
                      <h4 className="text-xl font-semibold mb-4 text-destructive flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Federal Ministries and Agencies
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "Ministry of Defense (Armed Forces)",
                          "Office of the Surveyor-General of the Federation",
                          "Ministry of Agriculture and Water Resources",
                          "Ministry of Mines and Steel Development",
                          "National Planning Commission",
                          "Federal Capital Development Authority",
                          "Nigeria National Petroleum Corporation",
                          "Ministry of Environment and Housing",
                          "Ministry of Transport",
                          "Ministry of Finance",
                          "National Population Commission"
                        ].map((ministry, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0"></div>
                            <span className="text-muted-foreground text-sm">
                              {ministry}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Responsibilities Tab */}
            <TabsContent value="responsibilities">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  Committee Responsibilities
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Policy Development",
                      description:
                        "Development of policies and guidelines for geospatial data management",
                      icon: Target,
                      color: "success"
                    },
                    {
                      title: "Coordination",
                      description:
                        "Coordination of geospatial activities across different sectors",
                      icon: Users,
                      color: "primary"
                    },
                    {
                      title: "Standards Promotion",
                      description: "Promotion of standards and best practices",
                      icon: Shield,
                      color: "info"
                    },
                    {
                      title: "Capacity Building",
                      description: "Oversight of capacity building initiatives",
                      icon: GraduationCap,
                      color: "warning"
                    },
                    {
                      title: "Monitoring",
                      description:
                        "Monitoring and evaluation of NGDI implementation",
                      icon: Globe,
                      color: "destructive"
                    },
                    {
                      title: "Strategic Planning",
                      description:
                        "Long-term strategic planning and roadmap development",
                      icon: MapPin,
                      color: "secondary"
                    }
                  ].map((responsibility, index) => {
                    const IconComponent = responsibility.icon
                    return (
                      <div
                        key={index}
                        className="bg-card p-6 rounded-lg border hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="p-3 bg-primary/10 rounded-lg mb-4 w-fit group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="text-xl font-semibold mb-3 text-foreground">
                          {responsibility.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {responsibility.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Key Members Tab */}
            <TabsContent value="members">
              <div className="bg-card rounded-xl p-8 shadow-soft border">
                <h3 className="text-3xl font-semibold mb-8 text-primary text-center">
                  Key Committee Members
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {committeeMembers.map(member => (
                    <div
                      key={member.id}
                      className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mr-4 group-hover:bg-muted/80 transition-colors duration-300">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">
                            {member.name}
                          </h4>
                          <p className="text-sm text-primary font-medium">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {member.affiliation}
                      </p>

                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {member.bioSnippet}
                      </p>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-foreground mb-2">
                          Expertise:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {member.expertise.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-2" />
                          {member.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-2" />
                          {member.phone}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* NGDI Technical Framework Section */}
        <section id="technical-framework">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <h2 className="text-3xl font-semibold mb-6 text-primary text-center">
              NGDI Technical Framework
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground mb-8 text-center max-w-4xl mx-auto">
              The NGDI technical framework establishes the architecture for
              geospatial data sharing and collaboration across Nigeria. It
              enables efficient data discovery, access, and integration while
              ensuring interoperability between different systems.
            </p>

            <div className="bg-card rounded-lg p-6 border">
              <div className="w-full aspect-video relative overflow-hidden rounded-lg mb-4">
                <div className="flex items-center justify-center bg-muted w-full h-full">
                  <NgdiArchitecturePlaceholder className="w-full h-auto" />
                </div>
              </div>
              <p className="text-center text-muted-foreground text-sm">
                Figure 2: Nigerian NGDI Technical Framework - Architecture for
                geospatial data sharing and management
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact-committee">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <h2 className="text-3xl font-semibold mb-6 text-primary text-center">
              Get Involved
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
              Learn more about the NGDI Committee's work or get in touch with
              the secretariat to explore collaboration opportunities.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-md transition-colors duration-300 group"
              >
                Contact the Secretariat
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg shadow-md transition-colors duration-300 group"
              >
                About NGDI
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
