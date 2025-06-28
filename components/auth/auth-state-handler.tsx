"use client"

import { useUser } from "@clerk/nextjs"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function AuthStateHandler() {
  const { isLoaded, isSignedIn } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state during hydration and while Clerk is loading
  if (!mounted || !isLoaded) {
    return (
      <div className="flex items-center space-x-2" suppressHydrationWarning>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    )
  }

  return (
    <div suppressHydrationWarning>
      <SignedOut>
        <div className="flex items-center space-x-2">
          <SignInButton>
            <Button variant="outline" size="sm">
              Login
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm">Sign Up</Button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "size-8"
            }
          }}
        />
      </SignedIn>
    </div>
  )
}
