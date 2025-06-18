"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Save, AlertCircle, CheckCircle, Clock, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface AutoSaveStatusProps {
  lastSaved: Date | null
  isSaving: boolean
  hasUnsavedChanges: boolean
  onRestore?: () => void
  onClearSaved?: () => void
  className?: string
}

export function AutoSaveStatus({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  onRestore,
  onClearSaved,
  className
}: AutoSaveStatusProps) {
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)

  const getStatusIcon = () => {
    if (isSaving) {
      return <Save className="h-3 w-3 animate-spin" />
    }
    if (hasUnsavedChanges) {
      return <Clock className="h-3 w-3" />
    }
    if (lastSaved) {
      return <CheckCircle className="h-3 w-3" />
    }
    return <AlertCircle className="h-3 w-3" />
  }

  const getStatusText = () => {
    if (isSaving) {
      return "Saving..."
    }
    if (hasUnsavedChanges) {
      return "Changes pending"
    }
    if (lastSaved) {
      return `Saved ${format(lastSaved, "HH:mm:ss")}`
    }
    return "Not saved"
  }

  const getStatusVariant = () => {
    if (isSaving) {
      return "secondary"
    }
    if (hasUnsavedChanges) {
      return "outline"
    }
    if (lastSaved) {
      return "default"
    }
    return "destructive"
  }

  const handleRestore = () => {
    if (onRestore) {
      onRestore()
      setShowRecoveryDialog(false)
    }
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={getStatusVariant()}
                className="flex items-center gap-1.5 text-xs"
              >
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Auto-save Status</p>
                {lastSaved && (
                  <p className="text-xs">
                    Last saved: {format(lastSaved, "PPp")}
                  </p>
                )}
                {hasUnsavedChanges && (
                  <p className="text-xs text-amber-600">
                    You have unsaved changes that will be automatically saved
                    shortly.
                  </p>
                )}
                {!lastSaved && !isSaving && (
                  <p className="text-xs text-muted-foreground">
                    Auto-save will begin once you start editing the form.
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {lastSaved && onRestore && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecoveryDialog(true)}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Restore from auto-save</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Recovery Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Auto-saved Data</DialogTitle>
            <DialogDescription>
              Would you like to restore your previously auto-saved form data?
              This will replace any current changes with the last auto-saved
              version.
            </DialogDescription>
          </DialogHeader>

          {lastSaved && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Last saved: {format(lastSaved, "PPp")}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRecoveryDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRestore}>Restore Data</Button>
            {onClearSaved && (
              <Button
                variant="destructive"
                onClick={() => {
                  onClearSaved()
                  setShowRecoveryDialog(false)
                }}
              >
                Clear Saved Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
