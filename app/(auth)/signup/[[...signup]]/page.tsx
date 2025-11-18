/*
<ai_context>
This client page provides the signup form from Clerk.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

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
      <DialogContent className="max-w-md border-2 border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-0 shadow-2xl sm:rounded-2xl overflow-hidden gap-0">
        <VisuallyHidden>
          <DialogTitle>Sign Up</DialogTitle>
        </VisuallyHidden>

        {/* Animated background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-green-900/20"></div>
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10">
          <SignUp
            forceRedirectUrl="/"
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-0 p-6",
                headerTitle: "text-white text-2xl font-bold",
                headerSubtitle: "text-slate-300",
                socialButtonsBlockButton:
                  "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 backdrop-blur-sm transition-all",
                formButtonPrimary:
                  "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all",
                formFieldInput:
                  "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400 backdrop-blur-sm focus:border-blue-500/50 transition-all",
                footerActionLink:
                  "text-blue-400 hover:text-blue-300 transition-colors",
                identityPreviewText: "text-white",
                formFieldLabel: "text-slate-300",
                dividerLine: "bg-slate-700/50",
                dividerText: "text-slate-400"
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
