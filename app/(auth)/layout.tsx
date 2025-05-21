/*
<ai_context>
This server layout provides a centered layout for (auth) pages.
</ai_context>
*/

import "../globals.css"
// Temporarily remove Google font
// import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/utilities/providers"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"

// Temporarily disable Google font
// const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Authentication - NGDI Portal",
  description: "Login or sign up for the NGDI Portal."
}

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background min-h-screen w-full scroll-smooth antialiased"
            // Temporarily disable Google font
            // inter.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
                {children}
              </div>
            </div>
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
