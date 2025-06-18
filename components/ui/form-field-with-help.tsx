"use client"

import * as React from "react"
import { FieldHelp } from "@/components/ui/help-tooltip"
import { getHelpContent } from "@/lib/help-content"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FormFieldWithHelpProps {
  label: string
  helpKey?: string
  required?: boolean
  className?: string
  children: React.ReactNode
  description?: string
  customHelp?: {
    title?: string
    content: string
    examples?: string[]
    learnMoreUrl?: string
  }
}

export function FormFieldWithHelp({
  label,
  helpKey,
  required = false,
  className,
  children,
  description,
  customHelp
}: FormFieldWithHelpProps) {
  const helpContent = helpKey ? getHelpContent(helpKey) : null
  const finalHelpContent = customHelp || helpContent

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {finalHelpContent && (
          <FieldHelp
            title={finalHelpContent.title}
            content={finalHelpContent.content}
            examples={finalHelpContent.examples}
            learnMoreUrl={finalHelpContent.learnMoreUrl}
          />
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {children}
    </div>
  )
}

// Enhanced label component with optional help
export interface LabelWithHelpProps {
  children: React.ReactNode
  helpKey?: string
  required?: boolean
  className?: string
  customHelp?: {
    title?: string
    content: string
    examples?: string[]
    learnMoreUrl?: string
  }
}

export function LabelWithHelp({
  children,
  helpKey,
  required = false,
  className,
  customHelp
}: LabelWithHelpProps) {
  const helpContent = helpKey ? getHelpContent(helpKey) : null
  const finalHelpContent = customHelp || helpContent

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Label className="text-sm font-medium">
        {children}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {finalHelpContent && (
        <FieldHelp
          title={finalHelpContent.title}
          content={finalHelpContent.content}
          examples={finalHelpContent.examples}
          learnMoreUrl={finalHelpContent.learnMoreUrl}
        />
      )}
    </div>
  )
}
