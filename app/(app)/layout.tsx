/*
<ai_context>
This server layout provides a shared structure for (app) routes.
</ai_context>
*/

"use server"

export default async function AppPagesLayout({
  children
}: {
  children: React.ReactNode
}) {
  // This is now a simple pass-through layout since sidebar functionality
  // has been moved to the root layout
  return children
}
