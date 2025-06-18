"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Archive,
  Camera,
  Folder,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileItem {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  preview?: string
}

interface MobileFileUploadProps {
  value?: FileItem[]
  onChange: (files: FileItem[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  maxFiles?: number
  className?: string
}

export function MobileFileUpload({
  value = [],
  onChange,
  accept = "*/*",
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  className
}: MobileFileUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-5 w-5" />
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="h-5 w-5" />
    if (type.includes("zip") || type.includes("archive"))
      return <Archive className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)} limit`
    }
    if (value.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`
    }
    return null
  }

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise(resolve => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target?.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const handleFileSelection = async (files: FileList | null) => {
    if (!files) return

    const newFiles: FileItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)

      if (error) {
        // Show error - could integrate with toast system
        console.error(error)
        continue
      }

      const preview = await createFilePreview(file)

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        progress: 0,
        status: "pending",
        preview
      })
    }

    onChange([...value, ...newFiles])
  }

  const removeFile = (id: string) => {
    onChange(value.filter(item => item.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelection(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className={cn("relative", className)}>
          <Button
            variant="outline"
            className="w-full h-12 justify-start"
            type="button"
          >
            <Upload className="h-4 w-4 mr-2" />
            {value.length > 0
              ? `${value.length} file(s) selected`
              : "Add attachments"}
          </Button>
          {value.length > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center"
              variant="secondary"
            >
              {value.length}
            </Badge>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add File Attachments</DialogTitle>
          <DialogDescription>
            Upload documents, images, or other files related to your metadata.
            Maximum {maxFiles} files, {formatFileSize(maxSize)} each.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop files here or choose upload method
              </p>
              <p className="text-xs text-muted-foreground">
                Supports most file types up to {formatFileSize(maxSize)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                onClick={openFileSelector}
                className="flex-1 h-11"
              >
                <Folder className="h-4 w-4 mr-2" />
                Browse Files
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={openCamera}
                className="flex-1 h-11"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        </div>

        {/* File List */}
        {value.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Selected Files ({value.length}/{maxFiles})
            </Label>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {value.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        {getFileIcon(item.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {item.status === "uploading" && (
                      <Progress value={item.progress} className="mt-1 h-1" />
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {item.status === "completed" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden File Inputs */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={e => handleFileSelection(e.target.files)}
        />

        <Input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => handleFileSelection(e.target.files)}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1 h-11"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
