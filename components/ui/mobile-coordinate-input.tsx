"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Grid, Calculator, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoordinateValue {
  minX?: number
  minY?: number
  maxX?: number
  maxY?: number
}

interface MobileCoordinateInputProps {
  value?: CoordinateValue
  onChange: (value: CoordinateValue) => void
  placeholder?: string
  className?: string
}

export function MobileCoordinateInput({
  value = {},
  onChange,
  placeholder = "Enter coordinates",
  className
}: MobileCoordinateInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempValue, setTempValue] = useState<CoordinateValue>(value)

  // Format coordinates for display
  const formatCoordinates = (coords: CoordinateValue) => {
    if (
      coords.minX == null &&
      coords.minY == null &&
      coords.maxX == null &&
      coords.maxY == null
    ) {
      return ""
    }
    return `${coords.minX ?? ""}, ${coords.minY ?? ""}, ${coords.maxX ?? ""}, ${coords.maxY ?? ""}`
  }

  const handleSave = () => {
    onChange(tempValue)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            value={formatCoordinates(value)}
            placeholder={placeholder}
            readOnly
            className="pr-10 cursor-pointer"
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter Spatial Coordinates</DialogTitle>
          <DialogDescription>
            Define the bounding box for your spatial data using different input
            methods.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="decimal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="decimal" className="text-xs">
              <Calculator className="h-4 w-4 mr-1" />
              Decimal
            </TabsTrigger>
            <TabsTrigger value="dms" className="text-xs">
              <Grid className="h-4 w-4 mr-1" />
              DMS
            </TabsTrigger>
            <TabsTrigger value="quick" className="text-xs">
              <MapPin className="h-4 w-4 mr-1" />
              Quick
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decimal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minX" className="text-sm font-medium">
                  West (Min X)
                </Label>
                <Input
                  id="minX"
                  type="number"
                  step="any"
                  placeholder="-180"
                  value={tempValue.minX || ""}
                  onChange={e =>
                    setTempValue(prev => ({
                      ...prev,
                      minX: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined
                    }))
                  }
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxX" className="text-sm font-medium">
                  East (Max X)
                </Label>
                <Input
                  id="maxX"
                  type="number"
                  step="any"
                  placeholder="180"
                  value={tempValue.maxX || ""}
                  onChange={e =>
                    setTempValue(prev => ({
                      ...prev,
                      maxX: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined
                    }))
                  }
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minY" className="text-sm font-medium">
                  South (Min Y)
                </Label>
                <Input
                  id="minY"
                  type="number"
                  step="any"
                  placeholder="-90"
                  value={tempValue.minY || ""}
                  onChange={e =>
                    setTempValue(prev => ({
                      ...prev,
                      minY: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined
                    }))
                  }
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxY" className="text-sm font-medium">
                  North (Max Y)
                </Label>
                <Input
                  id="maxY"
                  type="number"
                  step="any"
                  placeholder="90"
                  value={tempValue.maxY || ""}
                  onChange={e =>
                    setTempValue(prev => ({
                      ...prev,
                      maxY: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined
                    }))
                  }
                  className="h-12 text-base"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dms" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground text-center">
              Enter coordinates in Degrees, Minutes, Seconds format
            </div>
            <div className="space-y-4">
              {/* DMS input would be more complex - simplified for MVP */}
              <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                DMS input coming soon. Use decimal degrees for now.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quick" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground text-center mb-4">
              Common coordinate presets for quick selection
            </div>

            <div className="grid gap-2">
              {[
                {
                  name: "Global",
                  coords: { minX: -180, minY: -90, maxX: 180, maxY: 90 }
                },
                {
                  name: "North America",
                  coords: { minX: -170, minY: 15, maxX: -50, maxY: 72 }
                },
                {
                  name: "Europe",
                  coords: { minX: -25, minY: 35, maxX: 45, maxY: 72 }
                },
                {
                  name: "Asia",
                  coords: { minX: 60, minY: -10, maxX: 150, maxY: 55 }
                },
                {
                  name: "Africa",
                  coords: { minX: -20, minY: -35, maxX: 55, maxY: 38 }
                },
                {
                  name: "Australia",
                  coords: { minX: 110, minY: -45, maxX: 160, maxY: -10 }
                }
              ].map(preset => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-12 justify-between"
                  onClick={() => setTempValue(preset.coords)}
                >
                  <span>{preset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCoordinates(preset.coords)}
                  </span>
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 h-11"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 h-11">
            Save Coordinates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
