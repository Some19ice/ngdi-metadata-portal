/*
<ai_context>
This server page returns an enhanced "News Page" component with improved layout, animations, interactive elements, and better visual hierarchy.
</ai_context>
*/

"use server"

import Link from "next/link"
import {
  Rss,
  CalendarDays,
  Tag,
  Search,
  ArrowRight,
  Clock,
  TrendingUp,
  Newspaper,
  Filter,
  Eye,
  Share2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Enhanced news data with more details
const newsItems = [
  {
    id: "1",
    title: "NGDI Portal Phase 2 Launch Announced",
    date: "2024-07-15",
    category: "Portal Updates",
    imageUrl: "/placeholders/news-portal-launch.jpg",
    summary:
      "The NGDI development team is excited to announce the upcoming launch of Phase 2, bringing enhanced metadata management and search capabilities.",
    link: "/news/portal-phase-2-launch",
    author: "NGDI Development Team",
    readTime: "3 min read",
    featured: true,
    views: 1250,
    tags: ["portal", "update", "metadata", "search"]
  },
  {
    id: "2",
    title: "New Geospatial Data Standards Adopted",
    date: "2024-06-28",
    category: "Standards & Policy",
    imageUrl: "/placeholders/news-standards.jpg",
    summary:
      "A new set of geospatial data standards has been officially adopted to improve interoperability and data quality across all contributing nodes.",
    link: "/news/new-geospatial-standards-adopted",
    author: "Standards Committee",
    readTime: "5 min read",
    featured: true,
    views: 890,
    tags: ["standards", "policy", "interoperability", "quality"]
  },
  {
    id: "3",
    title: "Workshop on Geospatial Data for Urban Planning",
    date: "2024-05-10",
    category: "Events & Workshops",
    imageUrl: "/placeholders/news-workshop.jpg",
    summary:
      "Join us for an insightful workshop exploring the applications of geospatial data in sustainable urban development and planning.",
    link: "/news/workshop-urban-planning",
    author: "Training Department",
    readTime: "2 min read",
    featured: false,
    views: 675,
    tags: ["workshop", "urban planning", "training", "sustainability"]
  },
  {
    id: "4",
    title: "Collaboration with International Geo-Consortium",
    date: "2024-04-22",
    category: "Partnerships",
    imageUrl: "/placeholders/news-partnership.jpg",
    summary:
      "NGDI is proud to announce a new strategic partnership with the International Geo-Consortium to foster global data sharing initiatives.",
    link: "/news/collaboration-international-geo-consortium",
    author: "Partnership Office",
    readTime: "4 min read",
    featured: true,
    views: 1100,
    tags: ["partnership", "international", "collaboration", "data sharing"]
  },
  {
    id: "5",
    title: "NGDI Annual Conference 2024 Registration Open",
    date: "2024-03-15",
    category: "Events & Workshops",
    imageUrl: "/placeholders/news-conference.jpg",
    summary:
      "Registration is now open for the NGDI Annual Conference 2024. Join industry leaders, researchers, and practitioners for three days of insights and networking.",
    link: "/news/annual-conference-2024",
    author: "Events Team",
    readTime: "3 min read",
    featured: false,
    views: 2100,
    tags: ["conference", "registration", "networking", "industry"]
  },
  {
    id: "6",
    title: "Success Story: Flood Management in Rivers State",
    date: "2024-02-20",
    category: "Success Stories",
    imageUrl: "/placeholders/news-success.jpg",
    summary:
      "Discover how NGDI geospatial data helped Rivers State government implement an effective flood management system, reducing flood damage by 40%.",
    link: "/news/flood-management-success",
    author: "Case Studies Team",
    readTime: "6 min read",
    featured: false,
    views: 445,
    tags: ["success story", "flood management", "rivers state", "government"]
  }
]

// Categories with enhanced metadata
const categories = [
  { name: "All", count: newsItems.length, color: "slate" },
  { name: "Portal Updates", count: 1, color: "emerald" },
  { name: "Standards & Policy", count: 1, color: "blue" },
  { name: "Events & Workshops", count: 2, color: "purple" },
  { name: "Partnerships", count: 1, color: "amber" },
  { name: "Success Stories", count: 1, color: "rose" }
]

// Statistics for news
const newsStats = [
  {
    id: 1,
    label: "Total Articles",
    value: "50+",
    icon: Newspaper,
    description: "News articles and updates published"
  },
  {
    id: 2,
    label: "Monthly Readers",
    value: "12K+",
    icon: Eye,
    description: "Average monthly readership"
  },
  {
    id: 3,
    label: "Categories",
    value: "6",
    icon: Tag,
    description: "Different news categories"
  },
  {
    id: 4,
    label: "Latest Update",
    value: "Today",
    icon: Clock,
    description: "Most recent news update"
  }
]

export default async function NewsPage() {
  // Get featured news items
  const featuredNews = newsItems.filter(item => item.featured)
  const displayedItems = newsItems // Using placeholder, no filtering/sorting applied yet

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-10 text-center bg-gradient-info relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="inline-block px-4 py-2 mb-6 bg-info-light/50 text-info-foreground rounded-full text-sm font-medium backdrop-blur-sm border border-info/30">
            <Rss className="inline w-4 h-4 mr-2" />
            News & Updates
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-md text-info-foreground mb-6">
            NGDI News & Updates
          </h1>
          <p className="mt-6 text-xl leading-8 text-info-foreground/90 drop-shadow-sm max-w-3xl mx-auto">
            Stay informed with the latest announcements, articles, and
            developments from the National Geospatial Data Infrastructure
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {newsStats.map(stat => {
              const IconComponent = stat.icon
              return (
                <div
                  key={stat.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <IconComponent className="w-8 h-8 text-info-foreground/80 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-2xl font-bold text-info-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-info-foreground/80">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-20">
        {/* Featured News */}
        <section id="featured">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-semibold mb-8 text-info text-center flex items-center justify-center">
                <TrendingUp className="w-8 h-8 mr-3" />
                Featured News
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredNews.map(item => (
                  <div
                    key={item.id}
                    className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all duration-300 group relative"
                  >
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-info text-info-foreground">
                        Featured
                      </Badge>
                    </div>

                    <div className="flex items-center text-info mb-3">
                      <Tag className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-3 text-foreground group-hover:text-info transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {item.summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {item.views} views
                      </div>
                    </div>

                    <Link
                      href={item.link}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-info hover:bg-info/90 text-info-foreground font-medium rounded-lg shadow-sm transition-colors duration-300 text-sm group"
                    >
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Search */}
        <section id="filters">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <h2 className="text-2xl font-semibold mb-6 text-info flex items-center">
              <Search className="w-6 h-6 mr-3" />
              Find News
            </h2>
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div>
                <label
                  htmlFor="search-news"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Search News
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    id="search-news"
                    placeholder="Keywords, titles, authors..."
                    className="w-full pl-10 pr-3 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-300"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="category-filter"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Filter by Category
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <select
                    id="category-filter"
                    className="w-full pl-10 pr-8 py-3 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-300"
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="sort-by"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Sort By
                </label>
                <select
                  id="sort-by"
                  className="w-full px-3 py-3 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-300"
                >
                  <option value="date_desc">Date (Newest First)</option>
                  <option value="date_asc">Date (Oldest First)</option>
                  <option value="views_desc">Most Popular</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                </select>
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
                    <span className="ml-1 text-xs text-muted-foreground/70">
                      ({category.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* News Items Grid */}
        <section id="news-grid">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <h2 className="text-2xl font-semibold mb-8 text-info flex items-center">
              <Newspaper className="w-6 h-6 mr-3" />
              All News & Updates
            </h2>
            {displayedItems.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map(item => (
                  <Link href={item.link} key={item.id} className="block group">
                    <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <img
                        src={item.imageUrl}
                        alt={`Image for ${item.title}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-block bg-info/20 text-info text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                            {item.category}
                          </span>
                          {item.featured && (
                            <Badge variant="outline" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-info transition-colors line-clamp-2">
                          {item.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-2">
                          By {item.author}
                        </p>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3 flex-grow">
                          {item.summary}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                          <div className="flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            {new Date(item.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.readTime}
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {item.views}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="text-info group-hover:text-info/80 font-medium inline-flex items-center">
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
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  No News Items Found
                </h3>
                <p className="text-muted-foreground">
                  Please try adjusting your search or filters, or check back
                  later for new updates.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section id="newsletter">
          <div className="bg-card rounded-xl p-8 shadow-soft border">
            <div className="max-w-4xl mx-auto text-center">
              <div className="p-4 bg-info/10 rounded-full w-fit mx-auto mb-6">
                <Rss className="h-12 w-12 text-info" />
              </div>
              <h2 className="text-3xl font-semibold mb-6 text-info">
                Stay Updated
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter to receive the latest NGDI news,
                updates, and announcements directly in your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-300"
                />
                <button className="px-6 py-3 bg-info hover:bg-info/90 text-info-foreground font-semibold rounded-lg shadow-md transition-colors duration-300 group">
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4 inline group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
