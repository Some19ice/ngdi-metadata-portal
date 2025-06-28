/*
<ai_context>
This client component provides a theme switcher for the app.
</ai_context>
*/

"use client"

import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { HTMLAttributes, ReactNode, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ThemeSwitcherProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  variant?: "icon" | "button" | "toggle"
  showLabel?: boolean
}

export const ThemeSwitcher = ({
  children,
  variant = "icon",
  showLabel = false,
  ...props
}: ThemeSwitcherProps) => {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme)
  }

  // Show consistent skeleton during hydration
  if (!mounted) {
    return (
      <div className={cn("flex items-center justify-center", props.className)}>
        <Skeleton className="size-5 rounded" />
      </div>
    )
  }

  // Use resolvedTheme for more reliable theme detection
  const isDark = resolvedTheme === "dark"
  const toggleTheme = () => handleChange(isDark ? "light" : "dark")

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className={cn("gap-2", props.className)}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        suppressHydrationWarning
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        {showLabel && (isDark ? "Light" : "Dark")}
      </Button>
    )
  }

  if (variant === "toggle") {
    return (
      <div
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isDark ? "bg-primary" : "bg-muted",
          props.className
        )}
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            toggleTheme()
          }
        }}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        suppressHydrationWarning
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-background transition-transform shadow-sm",
            isDark ? "translate-x-6" : "translate-x-1"
          )}
        >
          <span className="flex h-full w-full items-center justify-center">
            {isDark ? (
              <Moon className="size-2.5 text-foreground" />
            ) : (
              <Sun className="size-2.5 text-foreground" />
            )}
          </span>
        </span>
      </div>
    )
  }

  // Default icon variant
  return (
    <div
      className={cn(
        "relative p-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        props.className
      )}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          toggleTheme()
        }
      }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
    >
      <div className="relative size-5">
        <Sun
          className={cn(
            "absolute inset-0 size-5 transition-all duration-300",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 size-5 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </div>
  )
}
