"use client"

import { useState } from "react"
import { Map } from "maplibre-gl"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import {
  useGISServices,
  type GISServiceLayerConfig
} from "@/lib/hooks/use-gis-services"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"

interface GISServicePanelProps {
  map: Map | null
  className?: string
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  title?: string
}

export default function GISServicePanel({
  map,
  className,
  position = "top-right",
  title = "GIS Services"
}: GISServicePanelProps) {
  const [serviceUrl, setServiceUrl] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [isAddingService, setIsAddingService] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const {
    serviceLayers,
    addServiceByUrl,
    removeService,
    toggleServiceVisibility
  } = useGISServices({ map })

  // Determine position classes
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4"
  }

  const handleAddService = async () => {
    if (!serviceUrl) {
      toast.error("Please enter a service URL")
      return
    }

    setIsAddingService(true)

    try {
      const success = await addServiceByUrl(
        serviceUrl,
        serviceName || undefined
      )

      if (success) {
        setServiceUrl("")
        setServiceName("")
        setShowAddDialog(false)
      }
    } finally {
      setIsAddingService(false)
    }
  }

  return (
    <Card
      className={cn(
        "absolute z-10 w-64 shadow-lg bg-white/90 backdrop-blur-sm",
        positionClasses[position],
        className
      )}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Layers className="h-4 w-4 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {serviceLayers.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No GIS services added
          </div>
        ) : (
          <div className="space-y-2">
            {serviceLayers.map(service => (
              <ServiceLayerItem
                key={service.id}
                service={service}
                onToggleVisibility={() => toggleServiceVisibility(service.id)}
                onRemove={() => removeService(service.id)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add GIS Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add GIS Service</DialogTitle>
              <DialogDescription>
                Enter the URL of an ArcGIS REST service, WMS, or WFS endpoint.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="service-url">Service URL</Label>
                <Input
                  id="service-url"
                  placeholder="https://services.arcgis.com/..."
                  value={serviceUrl}
                  onChange={e => setServiceUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Examples: ArcGIS MapServer, WMS GetCapabilities, WFS endpoint
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-name">Display Name (Optional)</Label>
                <Input
                  id="service-name"
                  placeholder="My GIS Service"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService} disabled={isAddingService}>
                {isAddingService ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

interface ServiceLayerItemProps {
  service: GISServiceLayerConfig
  onToggleVisibility: () => void
  onRemove: () => void
}

function ServiceLayerItem({
  service,
  onToggleVisibility,
  onRemove
}: ServiceLayerItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-gray-100 text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate" title={service.name}>
          {service.name}
        </div>

        {service.serviceType && (
          <div className="text-xs text-gray-500">{service.serviceType}</div>
        )}

        {service.error && (
          <div className="text-xs text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {service.error}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {service.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onToggleVisibility}
                    disabled={!!service.error}
                  >
                    {service.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {service.isVisible ? "Hide layer" : "Show layer"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                    onClick={onRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove layer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  )
}
