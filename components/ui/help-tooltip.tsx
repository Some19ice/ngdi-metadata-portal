"use client"

import * as React from "react"
import { HelpCircle, Info, AlertCircle, BookOpen } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface HelpTooltipProps {
  content: React.ReactNode
  title?: string
  examples?: string[]
  learnMoreUrl?: string
  variant?: "info" | "help" | "warning" | "example"
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  children?: React.ReactNode
}

export function HelpTooltip({
  content,
  title,
  examples,
  learnMoreUrl,
  variant = "help",
  side = "top",
  align = "center",
  className,
  children
}: HelpTooltipProps) {
  const icons = {
    info: Info,
    help: HelpCircle,
    warning: AlertCircle,
    example: BookOpen
  }

  const Icon = icons[variant]

  const iconColors = {
    info: "text-blue-500 hover:text-blue-600",
    help: "text-muted-foreground hover:text-foreground",
    warning: "text-amber-500 hover:text-amber-600",
    example: "text-green-500 hover:text-green-600"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center h-4 w-4 rounded-full transition-colors",
                iconColors[variant],
                className
              )}
              aria-label="Help information"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-sm p-0 overflow-hidden"
        >
          <div className="p-3 space-y-2">
            {title && (
              <div className="font-medium text-sm text-foreground">{title}</div>
            )}

            <div className="text-sm text-muted-foreground leading-relaxed">
              {content}
            </div>

            {examples && examples.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-foreground">
                  Examples:
                </div>
                <div className="space-y-1">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 font-mono"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {learnMoreUrl && (
              <div className="pt-2 border-t">
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Learn more
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Specialized help components for common use cases
export function FieldHelp({
  children,
  ...props
}: Omit<HelpTooltipProps, "children"> & { children?: React.ReactNode }) {
  return (
    <HelpTooltip {...props}>
      {children || (
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </HelpTooltip>
  )
}

export function ExampleHelp({
  children,
  ...props
}: Omit<HelpTooltipProps, "children" | "variant"> & {
  children?: React.ReactNode
}) {
  return (
    <HelpTooltip variant="example" {...props}>
      {children || (
        <BookOpen className="h-4 w-4 text-green-500 hover:text-green-600 transition-colors" />
      )}
    </HelpTooltip>
  )
}

export function InfoHelp({
  children,
  ...props
}: Omit<HelpTooltipProps, "children" | "variant"> & {
  children?: React.ReactNode
}) {
  return (
    <HelpTooltip variant="info" {...props}>
      {children || (
        <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
      )}
    </HelpTooltip>
  )
}
