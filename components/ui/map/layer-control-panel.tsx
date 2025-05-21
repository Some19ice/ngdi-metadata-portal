"use client"

import React from "react"
import { MapStyle } from "./map-view"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"

interface LayerControlPanelProps {
  availableStyles: MapStyle[]
  activeStyleId: string
  onStyleChange: (styleId: string) => void
  className?: string
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  title?: string
}

export default function LayerControlPanel({
  availableStyles,
  activeStyleId,
  onStyleChange,
  className,
  position = "top-left",
  title = "Base Layers"
}: LayerControlPanelProps) {
  // Determine position classes
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4"
  }

  // Check if any styles are missing URLs (likely due to missing API key)
  const hasMissingUrls = availableStyles.some(
    style => !style.url && style.id !== "streets"
  )

  return (
    <div
      className={cn(
        "absolute z-10 bg-white p-2 shadow-md rounded-md",
        positionClasses[position],
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hasMissingUrls && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">
                  Some map styles are unavailable. This may be due to a missing
                  API key.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex flex-col space-y-1">
        {availableStyles.map(style => {
          const isDisabled = !style.url

          return (
            <Button
              key={style.id}
              variant={style.id === activeStyleId ? "default" : "outline"}
              size="sm"
              onClick={() => onStyleChange(style.id)}
              disabled={isDisabled}
              className={cn(
                "w-full justify-start text-xs px-2 py-1 h-auto",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {style.name}
              {isDisabled && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-3 w-3 ml-1 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">This style requires an API key.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
