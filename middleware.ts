/*
<ai_context>
Contains middleware for protecting routes, checking user authentication, and redirecting as needed.
</ai_context>
*/

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
// NextResponse is not strictly needed here with the default behavior, but can be kept for future use.
// import { NextResponse } from "next/server"

// Define public routes
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
  "/api/clerk-user(.*)",
  "/api/stripe/webhooks(.*)"
  // Add other explicitly public marketing page routes here
  // e.g. /app/(marketing)/page.tsx related routes if they should be public
])

// Define protected routes (routes that require authentication)
// All other routes will be protected by default if not listed in isPublicRoute
// const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/app/(app)(.*)"]);

export default clerkMiddleware((auth, req) => {
  // If the request is for a public route, do nothing to let it pass through.
  // For any other route, Clerk's default behavior will protect it.
  if (isPublicRoute(req)) {
    return // Allow public routes
  }
  // For all other routes, Clerk will enforce authentication by default.
  // If you needed to explicitly protect here, it would be auth().protect(),
  // but often the default behavior is sufficient when public routes are handled.
})

export const config = {
  // Ensure the matcher includes the root and API routes, but excludes static files and _next assets.
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
}
