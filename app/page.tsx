"use server"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Search,
  MapPin,
  BarChart,
  FileText,
  Info,
  ArrowRight,
  Users,
  Globe,
  Database,
  ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import LandingSearchForm from "@/components/search/landing-search-form"

export default async function LandingPage() {
  // Placeholder data for featured datasets
  const featuredDatasets = [
    {
      id: "1",
      title: "National Land Cover Database",
      description:
        "Comprehensive land cover data for the entire nation, updated annually.",
      tags: ["Land Cover", "GIS", "Environmental"],
      organization: "Department of Geography",
      date: "Updated Jan 2023"
    },
    {
      id: "2",
      title: "Transportation Infrastructure Network",
      description: "Detailed network of roads, railways, and airports.",
      tags: ["Transportation", "Infrastructure", "Network"],
      organization: "Transport Authority",
      date: "Updated Mar 2023"
    },
    {
      id: "3",
      title: "Population Density Grid 2023",
      description:
        "High-resolution gridded population data for urban and rural areas.",
      tags: ["Demographics", "Population", "Spatial Analysis"],
      organization: "Census Bureau",
      date: "Updated Jun 2023"
    }
  ]

  // Statistics about the portal (would come from DB in production)
  const portalStats = [
    {
      label: "Datasets Available",
      value: "1,250+",
      icon: <Database className="h-5 w-5" />
    },
    {
      label: "Organizations",
      value: "120+",
      icon: <Users className="h-5 w-5" />
    },
    {
      label: "Data Categories",
      value: "45+",
      icon: <Globe className="h-5 w-5" />
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
        <div className="w-full max-w-lg mt-8">
          <label className="flex flex-col w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg overflow-hidden shadow-lg">
              <div
                className="text-[#51946b] flex border border-[#d1e6d9] bg-[#f8fbfa] items-center justify-center pl-[15px] rounded-l-lg border-r-0"
                data-icon="MagnifyingGlass"
                data-size="20px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20px"
                  height="20px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input
                placeholder="Search for datasets, keywords, or locations"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#0e1a13] focus:outline-0 focus:ring-0 border border-[#d1e6d9] bg-[#f8fbfa] focus:border-[#d1e6d9] h-[56px] placeholder:text-[#51946b] px-[15px] rounded-none border-r-0 border-l-0 text-sm md:text-base font-normal leading-normal"
                defaultValue=""
              />
              <div className="flex items-center justify-center rounded-r-lg border-l-0 border border-[#d1e6d9] bg-[#f8fbfa] pr-[7px]">
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-[40px] px-6 bg-[#39e079] text-[#0e1a13] text-sm md:text-base font-bold leading-normal tracking-[0.015em] transition-all hover:bg-[#2ec067]">
                  <span className="truncate">Search</span>
                </button>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 2xl:px-40 flex flex-1 justify-center py-10">
        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
          <h2 className="text-[#0e1a13] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3">
            Featured Datasets
          </h2>
          <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-stretch p-4 gap-3">
              <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex flex-col"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDA_mY9YvmD0PGxmPRzKX3UUVV24eMZvnoCgGtAdFYSp-F0e30bzqO-bwlTkS4acc1XcpgmImPj4qgdg99T2ff7xANJQmv80lowBoKmx3bDmkvowPVTD_FU_tYCS32-e-sO49Fn6E0QuYzuBi1aPH92F1Tqug8nsCP8lWzTGg29Vl5kyxEWbOrdEiO9z3bvZnoOn-KfbVFlPnFryFiTKS9JbWFach9kEDuZPCcFDtQznItLF8pOUVSEwkd-9XA4BnUdVk6pSYRZ3-I")'
                  }}
                ></div>
                <div>
                  <p className="text-[#0e1a13] text-base font-medium leading-normal">
                    Lagos Metropolitan Area Satellite Imagery
                  </p>
                  <p className="text-[#51946b] text-sm font-normal leading-normal">
                    High-resolution satellite imagery of Lagos, capturing urban
                    development and environmental changes.
                  </p>
                </div>
              </div>
              <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex flex-col"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAO3OfdFLWJ4jnMPnrNTDaRYran9vuu2pY9XpieE26wOWfyvzoymX7b1cPLT_weqZKJyU67NIDMcSchwHRxYFsgMWP_h7a07d6IvAJ0aoUl1krkPQUUM38HlY54D9-4uK2_b_sG9bn_wvRWiYTEyas0nsPDR59uU75cn6iInfdpw701lLqowCrhI_28bjzqEuwYFdU0AJmkpoBabpSEOIPCvTzQDpR7AwpRW7ROBlh8R7nMWjX8ord3jQgf2b8xdWglGvCGWNR9dp0")'
                  }}
                ></div>
                <div>
                  <p className="text-[#0e1a13] text-base font-medium leading-normal">
                    Agricultural Land Use in Nigeria
                  </p>
                  <p className="text-[#51946b] text-sm font-normal leading-normal">
                    Detailed mapping of agricultural land use across Nigeria,
                    including crop types and irrigation systems.
                  </p>
                </div>
              </div>
              <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex flex-col"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDd3PdvFHxcwjtMQe3p3Gu_PhiaaRMMR2orcAGz6GqL4iQaSDKdpqR5tZPo6DVKWWX9HW8imoP_CapOHnrUeyb7xRy-IVma6IkWn0PfqZzb03VErIvPzM0T5fyZ6teCSgFcNrXPhNRCiOpAXrzSTJZ3PLErD3p8mVTAYsojSxhmL8V2_dAjqRHaGP6opc3ck9rDoCB5IEJpKTpWMK6G8Wb4PFPPlD7Ew9DivKst_AnCGmVVlQEmhJhuv8Ti94qajmTVOzySVirAMps")'
                  }}
                ></div>
                <div>
                  <p className="text-[#0e1a13] text-base font-medium leading-normal">
                    Geological Survey of the Niger Delta Region
                  </p>
                  <p className="text-[#51946b] text-sm font-normal leading-normal">
                    Comprehensive geological survey data for the Niger Delta,
                    including seismic and well log information.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-[#0e1a13] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            Quick Links
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
            <div className="flex flex-1 gap-3 rounded-lg border border-[#d1e6d9] bg-[#f8fbfa] p-4 flex-col">
              <div
                className="text-[#0e1a13]"
                data-icon="MapPin"
                data-size="24px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-[#0e1a13] text-base font-bold leading-tight">
                  Administrative Boundaries
                </h2>
                <p className="text-[#51946b] text-sm font-normal leading-normal">
                  Datasets related to Nigeria's administrative divisions,
                  including states, local government areas, and wards.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-3 rounded-lg border border-[#d1e6d9] bg-[#f8fbfa] p-4 flex-col">
              <div
                className="text-[#0e1a13]"
                data-icon="GlobeHemisphereWest"
                data-size="24px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.62,87.62,0,0,1-6.4,32.94l-44.7-27.49a15.92,15.92,0,0,0-6.24-2.23l-22.82-3.08a16.11,16.11,0,0,0-16,7.86h-8.72l-3.8-7.86a15.91,15.91,0,0,0-11-8.67l-8-1.73L96.14,104h16.71a16.06,16.06,0,0,0,7.73-2l12.25-6.76a16.62,16.62,0,0,0,3-2.14l26.91-24.34A15.93,15.93,0,0,0,166,49.1l-.36-.65A88.11,88.11,0,0,1,216,128ZM143.31,41.34,152,56.9,125.09,81.24,112.85,88H96.14a16,16,0,0,0-13.88,8l-8.73,15.23L63.38,84.19,74.32,58.32a87.87,87.87,0,0,1,69-17ZM40,128a87.53,87.53,0,0,1,8.54-37.8l11.34,30.27a16,16,0,0,0,11.62,10l21.43,4.61L96.74,143a16.09,16.09,0,0,0,14.4,9h1.48l-7.23,16.23a16,16,0,0,0,2.86,17.37l.14.14L128,205.94l-1.94,10A88.11,88.11,0,0,1,40,128Zm102.58,86.78,1.13-5.81a16.09,16.09,0,0,0-4-13.9,1.85,1.85,0,0,1-.14-.14L120,174.74,133.7,144l22.82,3.08,45.72,28.12A88.18,88.18,0,0,1,142.58,214.78Z"></path>
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-[#0e1a13] text-base font-bold leading-tight">
                  Environmental Data
                </h2>
                <p className="text-[#51946b] text-sm font-normal leading-normal">
                  Environmental datasets covering air quality, water resources,
                  and climate change indicators.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-3 rounded-lg border border-[#d1e6d9] bg-[#f8fbfa] p-4 flex-col">
              <div
                className="text-[#0e1a13]"
                data-icon="TreePalm"
                data-size="24px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M237.79,53.23a66.86,66.86,0,0,0-97.74,0,72.21,72.21,0,0,0-12.05,17,72.21,72.21,0,0,0-12-17,66.86,66.86,0,0,0-97.74,0,8,8,0,0,0,2.6,12.85L77,90.55a71.42,71.42,0,0,0-43.36,33.21,70.64,70.64,0,0,0-7.2,54.32A8,8,0,0,0,39,182.36l81-61.68V224a8,8,0,0,0,16,0V120.68l81,61.68a8,8,0,0,0,12.57-4.28,70.64,70.64,0,0,0-7.2-54.32A71.42,71.42,0,0,0,179,90.55l56.22-24.47a8,8,0,0,0,2.6-12.85ZM67.08,48a51.13,51.13,0,0,1,37.28,16.26,56.53,56.53,0,0,1,14.26,26.93L39,56.53A50.5,50.5,0,0,1,67.08,48ZM40,161.5a54.82,54.82,0,0,1,7.47-29.7,55.55,55.55,0,0,1,34-25.89A56.52,56.52,0,0,1,96.1,104a55.82,55.82,0,0,1,16.23,2.41ZM208.5,131.8A54.82,54.82,0,0,1,216,161.5l-72.3-55.1a56.3,56.3,0,0,1,64.83,25.4ZM137.38,91.19a56.53,56.53,0,0,1,14.26-26.93A51.13,51.13,0,0,1,188.92,48,50.5,50.5,0,0,1,217,56.53Z"></path>
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-[#0e1a13] text-base font-bold leading-tight">
                  Land Use and Land Cover
                </h2>
                <p className="text-[#51946b] text-sm font-normal leading-normal">
                  Datasets on land use and land cover, including vegetation
                  types, urban areas, and protected areas.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-3 rounded-lg border border-[#d1e6d9] bg-[#f8fbfa] p-4 flex-col">
              <div
                className="text-[#0e1a13]"
                data-icon="Buildings"
                data-size="24px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z"></path>
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-[#0e1a13] text-base font-bold leading-tight">
                  Infrastructure
                </h2>
                <p className="text-[#51946b] text-sm font-normal leading-normal">
                  Datasets on infrastructure, including transportation networks,
                  energy infrastructure, and communication networks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features/Info Section - Improved with better visuals */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-semibold md:text-3xl">
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
              <p className="text-center text-muted-foreground">
                Visualize and interact with geospatial data through
                user-friendly map interfaces.
              </p>
              <Link
                href="/search?type=map"
                className="mt-4 relative overflow-hidden"
              >
                <Button
                  variant="link"
                  className="group-hover:text-blue-700 flex items-center"
                >
                  <span className="relative z-10">Explore Maps</span>
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="mb-5 rounded-full bg-green-100 p-5 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                <BarChart className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-semibold group-hover:text-green-600 transition-colors">
                Metadata Standards
              </h3>
              <p className="text-center text-muted-foreground">
                Access comprehensive and standardized metadata following NGDI
                specifications.
              </p>
              <Link
                href="/search?type=metadata"
                className="mt-4 relative overflow-hidden"
              >
                <Button
                  variant="link"
                  className="group-hover:text-green-700 flex items-center"
                >
                  <span className="relative z-10">Browse Metadata</span>
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="mb-5 rounded-full bg-amber-100 p-5 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-semibold group-hover:text-amber-600 transition-colors">
                User Guides
              </h3>
              <p className="text-center text-muted-foreground">
                Comprehensive documentation to help you leverage the portal's
                full capabilities.
              </p>
              <Link href="/docs" className="mt-4 relative overflow-hidden">
                <Button
                  variant="link"
                  className="group-hover:text-amber-700 flex items-center"
                >
                  <span className="relative z-10">Read Documentation</span>
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="mb-5 rounded-full bg-purple-100 p-5 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all transform group-hover:scale-110 duration-300 shadow-sm group-hover:shadow-md">
                <Info className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-semibold group-hover:text-purple-600 transition-colors">
                About NGDI
              </h3>
              <p className="text-center text-muted-foreground">
                Learn about the National Geospatial Data Infrastructure and our
                mission.
              </p>
              <Link href="/about" className="mt-4 relative overflow-hidden">
                <Button
                  variant="link"
                  className="group-hover:text-purple-700 flex items-center"
                >
                  <span className="relative z-10">About the Initiative</span>
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Organizations/Contributors Section - New section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold md:text-3xl mb-3">
              Contributing Organizations
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The NGDI Portal is made possible by the contributions of numerous
              organizations dedicated to improving access to geospatial data.
            </p>
          </div>

          {/* Placeholder for organization logos - In a real app, would be dynamically populated */}
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[1, 2, 3, 4, 5, 6].map(org => (
              <div
                key={org}
                className="h-16 w-32 rounded-md bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-8 w-20 rounded"></div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/search?type=organization">
              <Button variant="outline" className="group">
                View All Organizations
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Updates Section - New */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-semibold md:text-3xl">
              Latest Updates
            </h2>
            <Link
              href="/search?type=news"
              className="flex items-center text-blue-600 hover:underline"
            >
              View all updates <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "New Climate Data Added",
                date: "July 12, 2023",
                excerpt:
                  "The latest climate projections datasets are now available through the NGDI Portal with enhanced visualization options.",
                tag: "New Data"
              },
              {
                title: "Portal Performance Improvements",
                date: "June 28, 2023",
                excerpt:
                  "We've made significant performance enhancements to the map visualization system for faster rendering of large datasets.",
                tag: "System Update"
              },
              {
                title: "Upcoming Workshop: Metadata Creation",
                date: "June 15, 2023",
                excerpt:
                  "Join our virtual workshop on best practices for creating high-quality metadata for geospatial datasets.",
                tag: "Event"
              }
            ].map((update, i) => (
              <Card
                key={i}
                className="overflow-hidden hover:shadow-md transition-all"
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
                  <CardTitle className="mt-2 text-xl">{update.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {update.excerpt}
                  </CardDescription>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link
                    href={`/search?type=news&id=${i + 1}`}
                    className="w-full"
                  >
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
    </div>
  )
}
