"use server"

import Link from "next/link"
import { Rss, CalendarDays, Tag, Search, ArrowRight } from "lucide-react"

// Placeholder data for news items - replace with actual data fetching
const newsItems = [
  {
    id: "1",
    title: "NGDI Portal Phase 2 Launch Announced",
    date: "2024-07-15",
    category: "Portal Updates",
    imageUrl: "/placeholders/news-portal-launch.jpg", // Replace with actual image
    summary:
      "The NGDI development team is excited to announce the upcoming launch of Phase 2, bringing enhanced metadata management and search capabilities.",
    link: "/news/portal-phase-2-launch"
  },
  {
    id: "2",
    title: "New Geospatial Data Standards Adopted",
    date: "2024-06-28",
    category: "Standards & Policy",
    imageUrl: "/placeholders/news-standards.jpg", // Replace with actual image
    summary:
      "A new set of geospatial data standards has been officially adopted to improve interoperability and data quality across all contributing nodes.",
    link: "/news/new-geospatial-standards-adopted"
  },
  {
    id: "3",
    title: "Workshop on Geospatial Data for Urban Planning",
    date: "2024-05-10",
    category: "Events & Workshops",
    imageUrl: "/placeholders/news-workshop.jpg", // Replace with actual image
    summary:
      "Join us for an insightful workshop exploring the applications of geospatial data in sustainable urban development and planning.",
    link: "/news/workshop-urban-planning"
  },
  {
    id: "4",
    title: "Collaboration with International Geo-Consortium",
    date: "2024-04-22",
    category: "Partnerships",
    imageUrl: "/placeholders/news-partnership.jpg", // Replace with actual image
    summary:
      "NGDI is proud to announce a new strategic partnership with the International Geo-Consortium to foster global data sharing initiatives.",
    link: "/news/collaboration-international-geo-consortium"
  }
  // Add more news items as needed
]

// Placeholder for categories - in a real app, this might come from a DB
const categories = [
  "All",
  "Portal Updates",
  "Standards & Policy",
  "Events & Workshops",
  "Partnerships",
  "Success Stories"
]

export default async function NewsPage() {
  // In a real app, you'd fetch newsItems and categories, and handle filtering/sorting
  // const currentCategory = searchParams?.category || "All";
  // const searchQuery = searchParams?.query || "";
  // const sortBy = searchParams?.sort || "date_desc";

  // const filteredItems = newsItems.filter(item => {
  //   const matchesCategory = currentCategory === "All" || item.category === currentCategory;
  //   const matchesSearch = searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.summary.toLowerCase().includes(searchQuery.toLowerCase());
  //   return matchesCategory && matchesSearch;
  // });

  // const sortedItems = filteredItems.sort((a, b) => {
  //   if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
  //   if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
  //   if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
  //   if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
  //   return 0;
  // });

  const displayedItems = newsItems // Using placeholder, no filtering/sorting applied yet

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-teal-500 to-cyan-600">
        <div className="container mx-auto px-6">
          <div className="flex justify-center items-center mb-4">
            <Rss className="h-16 w-16 text-white drop-shadow-md" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md">
            NGDI News & Updates
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            Stay informed with the latest announcements, articles, and
            developments from the National Geospatial Data Infrastructure.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        {/* Filters and Sort (Placeholder UI) */}
        <div className="mb-12 p-6 bg-slate-800/70 rounded-lg shadow-lg">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div>
              <label
                htmlFor="search-news"
                className="block text-sm font-medium text-cyan-400 mb-1"
              >
                <Search className="inline h-4 w-4 mr-1" />
                Search News
              </label>
              <input
                type="text"
                id="search-news"
                // value={searchQuery}
                // onChange={(e) => router.push(\`?query=\${e.target.value}&category=\${currentCategory}&sort=\${sortBy}\`)}
                placeholder="Keywords..."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-cyan-400 mb-1"
              >
                <Tag className="inline h-4 w-4 mr-1" />
                Filter by Category
              </label>
              <select
                id="category-filter"
                // value={currentCategory}
                // onChange={(e) => router.push(\`?category=\${e.target.value}&query=\${searchQuery}&sort=\${sortBy}\`)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="sort-by"
                className="block text-sm font-medium text-cyan-400 mb-1"
              >
                <CalendarDays className="inline h-4 w-4 mr-1" />
                Sort By
              </label>
              <select
                id="sort-by"
                // value={sortBy}
                // onChange={(e) => router.push(\`?sort=\${e.target.value}&query=\${searchQuery}&category=\${currentCategory}\`)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* News Items Grid */}
        {displayedItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedItems.map(item => (
              <Link href={item.link} key={item.id} className="block group">
                <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden h-full flex flex-col hover:shadow-cyan-500/30 transition-shadow duration-300">
                  <img
                    src={item.imageUrl}
                    alt={`Image for ${item.title}`}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-2">
                      <span className="inline-block bg-cyan-600 text-cyan-100 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-1">
                      <CalendarDays className="inline h-4 w-4 mr-1 text-cyan-500" />
                      {new Date(item.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
                      {item.summary}
                    </p>
                    <div className="mt-auto">
                      <div className="text-cyan-400 group-hover:text-cyan-300 font-medium inline-flex items-center">
                        Read More
                        <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-slate-300 mb-2">
              No News Items Found
            </h3>
            <p className="text-slate-400">
              Please try adjusting your search or filters, or check back later
              for new updates.
            </p>
          </div>
        )}

        {/* Pagination Placeholder */}
        {/* <div className="mt-16 flex justify-center">
          <nav aria-label="Pagination">
            <ul className="inline-flex items-center -space-x-px">
              <li>
                <a href="#" className="py-2 px-3 ml-0 leading-tight text-slate-400 bg-slate-800 rounded-l-lg border border-slate-700 hover:bg-slate-700 hover:text-cyan-400">Previous</a>
              </li>
              <li>
                <a href="#" aria-current="page" className="py-2 px-3 text-cyan-400 bg-cyan-700/30 border border-slate-700 hover:bg-cyan-600/40 hover:text-cyan-300">1</a>
              </li>
              <li>
                <a href="#" className="py-2 px-3 leading-tight text-slate-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-cyan-400">2</a>
              </li>
              <li>
                <a href="#" className="py-2 px-3 leading-tight text-slate-400 bg-slate-800 rounded-r-lg border border-slate-700 hover:bg-slate-700 hover:text-cyan-400">Next</a>
              </li>
            </ul>
          </nav>
        </div> */}
      </div>
    </div>
  )
}
