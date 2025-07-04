/*
<ai_context>
This client page provides the signup form from Clerk.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) {
          router.back()
        }
      }}
    >
      <DialogContent className="max-w-md border border-border bg-background p-0 shadow-lg sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Sign Up</DialogTitle>
        </DialogHeader>
        <SignUp
          forceRedirectUrl="/"
          appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
        />
      </DialogContent>
    </Dialog>
  )
}
