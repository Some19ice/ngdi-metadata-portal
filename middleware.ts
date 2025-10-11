/*
<ai_context>
Contains middleware for protecting routes, checking user authentication, and redirecting as needed.
</ai_context>
*/

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { applyRateLimitDetailed, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter"

// Define public routes (pages and APIs that should be accessible without auth)
const isPublicRoute = createRouteMatcher([
  "/", // Main landing page
  "/login(.*)",
  "/signup(.*)",
  "/about(.*)",
  "/committee(.*)",
  "/contact(.*)",
  "/docs(.*)",
  "/faq(.*)",
  "/news(.*)",
  "/pricing(.*)", // Assuming pricing is public
  "/privacy(.*)",
  "/publications(.*)",
  "/terms(.*)",
  // Keep metadata pages public for now
  "/metadata(.*)",
  // Public API endpoints used by public pages/search
  "/api/search(.*)",
  "/api/metadata(.*)",
  "/api/map/geocode(.*)",
  "/api/states-data(.*)",
  "/api/clerk-user(.*)",
  "/api/stripe/webhooks(.*)"
  // Add other explicitly public marketing page routes here
  // e.g. /app/(marketing)/page.tsx related routes if they should be public
])

// Define protected routes (routes that require authentication)
// All other routes will be protected by default if not listed in isPublicRoute
// const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/app/(app)(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting before authentication checks
  let rateLimitConfig:
    | (typeof RATE_LIMIT_CONFIGS)[keyof typeof RATE_LIMIT_CONFIGS]
    | undefined
  const pathname = req.nextUrl.pathname

  // Determine rate limit configuration based on route
  if (pathname.startsWith("/api/")) {
    if (pathname.includes("/search") || pathname.includes("/metadata")) {
      rateLimitConfig = RATE_LIMIT_CONFIGS.search
    } else if (pathname.includes("/auth") || pathname.includes("/clerk")) {
      rateLimitConfig = RATE_LIMIT_CONFIGS.auth
    } else if (pathname.includes("/upload")) {
      rateLimitConfig = RATE_LIMIT_CONFIGS.upload
    } else {
      rateLimitConfig = RATE_LIMIT_CONFIGS.api
    }
  } else if (isPublicRoute(req)) {
    // Do not rate-limit public page views to avoid penalizing normal browsing
    rateLimitConfig = undefined as any
  } else {
    rateLimitConfig = RATE_LIMIT_CONFIGS.api
  }

  // Apply rate limiting for API routes only
  if (rateLimitConfig !== undefined) {
    const { limitedResponse, headers: rlHeaders } =
      await applyRateLimitDetailed(req, rateLimitConfig)
    if (limitedResponse) {
      return limitedResponse // Return rate limit error response
    }
    // Attach headers for successful API responses to inform clients
    const response = NextResponse.next()
    response.headers.set("x-pathname", pathname)
    for (const [key, value] of Object.entries(rlHeaders)) {
      response.headers.set(key, value)
    }
    if (isPublicRoute(req)) {
      return response
    }
    return response
  }

  // Create response and add pathname to headers for layout
  const response = NextResponse.next()
  response.headers.set("x-pathname", pathname)

  // If the request is for a public route, do nothing to let it pass through.
  // For any other route, Clerk's default behavior will protect it.
  if (isPublicRoute(req)) {
    return response // Allow public routes
  }
  // For all other routes, Clerk will enforce authentication by default.

  return response
})

export const config = {
  // Ensure the matcher includes the root and API routes, but excludes static files and _next assets.
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
}
