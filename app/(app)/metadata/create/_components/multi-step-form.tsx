"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { Check, ChevronRight, Loader2 } from "lucide-react"
import { MetadataFormValues } from "@/lib/validators/metadata-validator"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form } from "@/components/ui/form"

// Define and export FormStep type
export interface FormStep {
  id: string
  title: string
  component: React.ComponentType<any> // Or a more specific props type if available
  required?: boolean // Added to support conditional sections
  description?: string // Added to show section descriptions
  // fields?: string[]; // Optional: if validation per step is tied to specific fields in this structure
}

interface MultiStepFormProps {
  form: UseFormReturn<MetadataFormValues> // Use MetadataFormValues
  onSubmit: (values: MetadataFormValues) => Promise<void>
  onSaveDraft: (values: MetadataFormValues) => Promise<void> // Changed to MetadataFormValues
  isSubmitting: boolean // Renamed from isPending
  children: React.ReactNode[] // Step components are passed as children
  steps: FormStep[] // Use the defined FormStep type
  // Props for currentStep and setCurrentStep if managed by parent
  currentStep: number
  setCurrentStep: (step: number) => void
  isSavingDraft: boolean // Added to match usage in multi-step-metadata-form-client
  availableOrganizations: any[] // Added to match usage
  existingRecordId?: string | null // Added to match usage
  isLoading?: boolean // Added for consistency if used for loading states
}

// Add this field mapping right after the interface definitions
const STEP_FIELD_MAPPING: Record<number, string[]> = {
  0: [
    "title",
    "abstract",
    "keywords",
    "dataType",
    "topicCategory",
    "frameworkType"
  ],
  1: [
    "locationInfo.country",
    "locationInfo.geopoliticalZone",
    "locationInfo.state",
    "locationInfo.lga",
    "locationInfo.townCity"
  ],
  2: [
    "spatialInfo.coordinateSystem",
    "spatialInfo.projection",
    "spatialInfo.datum",
    "spatialInfo.resolutionScale",
    "spatialInfo.geometricObjectType",
    "spatialInfo.numFeaturesOrLayers",
    "spatialInfo.format",
    "spatialInfo.distributionFormat",
    "spatialInfo.spatialRepresentationType",
    "spatialInfo.boundingBox",
    "spatialInfo.verticalExtent",
    "spatialInfo.vectorSpatialRepresentation",
    "spatialInfo.rasterSpatialRepresentation",
    "spatialInfo.scale",
    "spatialInfo.resolution",
    "spatialInfo.minLatitude",
    "spatialInfo.maxLatitude",
    "spatialInfo.minLongitude",
    "spatialInfo.maxLongitude"
  ],
  3: ["temporalInfo.dateFrom", "temporalInfo.dateTo"],
  4: [
    "dataQualityInfo.logicalConsistencyReport",
    "dataQualityInfo.completenessReport",
    "dataQualityInfo.attributeAccuracyReport",
    "dataQualityInfo.horizontalAccuracy",
    "dataQualityInfo.verticalAccuracy"
  ],
  5: [
    "constraintsInfo.accessConstraints",
    "constraintsInfo.useConstraints",
    "constraintsInfo.otherConstraints",
    "technicalDetailsInfo.fileFormat",
    "technicalDetailsInfo.fileSizeMB",
    "technicalDetailsInfo.numFeaturesOrLayers",
    "technicalDetailsInfo.softwareHardwareRequirements",
    "metadataReferenceInfo.metadataCreationDate",
    "metadataReferenceInfo.metadataReviewDate",
    "metadataReferenceInfo.metadataPoc",
    "fundamentalDatasetsInfo.geodeticData",
    "fundamentalDatasetsInfo.topographicData",
    "fundamentalDatasetsInfo.cadastralData",
    "fundamentalDatasetsInfo.administrativeBoundaries"
  ],
  6: [
    "processingInfo.processingStepsDescription",
    "processingInfo.softwareAndVersionUsed",
    "processingInfo.processedDate",
    "processingInfo.processorContact",
    "processingInfo.sourceInfo"
  ],
  7: [] // Review step - no fields to validate
}

// Add this helper function to find which step has errors
const findStepWithErrors = (errors: any): number => {
  for (const [stepIndex, fields] of Object.entries(STEP_FIELD_MAPPING)) {
    const step = parseInt(stepIndex)
    for (const fieldPath of fields) {
      if (getNestedError(errors, fieldPath)) {
        return step
      }
    }
  }
  return -1 // No errors found
}

// Helper function to check if a step has errors
const stepHasErrors = (stepIndex: number, errors: any): boolean => {
  const fields = STEP_FIELD_MAPPING[stepIndex] || []
  return fields.some(fieldPath => getNestedError(errors, fieldPath))
}

// Helper function to check for nested errors
const getNestedError = (errors: any, fieldPath: string): boolean => {
  const parts = fieldPath.split(".")
  let current = errors

  for (const part of parts) {
    if (!current || typeof current !== "object") return false
    current = current[part]
  }

  return !!current
}

export default function MultiStepForm({
  form,
  onSubmit,
  onSaveDraft,
  isSubmitting, // Renamed from isPending
  children,
  steps,
  currentStep,
  setCurrentStep,
  isSavingDraft // Added
}: MultiStepFormProps) {
  // const router = useRouter() // Not used
  // const [currentStep, setCurrentStep] = useState(0) // Now passed as props
  // const [savingDraft, setSavingDraft] = useState(false) // Now isSavingDraft prop

  // Form validation status tracking
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {}
  )

  const isLastStep = currentStep === children.length - 1
  const currentStepContent = children[currentStep]

  // Check if current step is valid
  const validateCurrentStep = async () => {
    // const currentFieldNames = steps[currentStep]?.fields || [] // Modify if fields are on FormStep
    // For now, assume validation is handled by react-hook-form on submit/next trigger
    // const result = await form.trigger(); // Trigger validation for all fields if step-specific is not defined
    // setCompletedSteps(prev => ({ ...prev, [currentStep]: result }))
    // return result;
    return true // Placeholder, actual validation logic might be more complex or per field array
  }

  // Move to next step
  const handleNext = async () => {
    // await validateCurrentStep() // Optionally validate before navigating
    setCurrentStep(Math.min(currentStep + 1, children.length - 1))
    window.scrollTo(0, 0)
  }

  // Move to previous step without validation
  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
    window.scrollTo(0, 0)
  }

  // Save as draft functionality
  const handleInternalSaveDraft = async () => {
    // setSavingDraft(true); // Parent now controls isSavingDraft display
    try {
      await onSaveDraft(form.getValues())
      // toast.success("Draft saved successfully") // Toast handled by parent
    } catch (error) {
      // toast.error("Failed to save draft") // Toast handled by parent
      console.error("MultiStepForm draft save error:", error)
    } finally {
      // setSavingDraft(false); // Parent now controls isSavingDraft display
    }
  }

  // Render the step indicator
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        {/* Current step info card */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex-1 sm:ml-0 ml-0 mt-2 sm:mt-0">
              <h3 className="font-medium">{steps[currentStep]?.title}</h3>
              {steps[currentStep]?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {steps[currentStep].description}
                </p>
              )}
            </div>
            {steps[currentStep]?.required === false && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Optional
              </span>
            )}
          </div>
        </div>

        {/* Mobile-optimized step progress bar */}
        <div className="block sm:hidden">
          {/* Mobile: Compact horizontal progress bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>

          {/* Mobile: Current and next steps */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  stepHasErrors(currentStep, form.formState.errors)
                    ? "bg-destructive text-white"
                    : "bg-primary text-white"
                )}
              >
                {stepHasErrors(currentStep, form.formState.errors)
                  ? "!"
                  : currentStep + 1}
              </div>
              <span
                className={cn(
                  "font-medium",
                  stepHasErrors(currentStep, form.formState.errors)
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {steps[currentStep]?.title}
              </span>
              {stepHasErrors(currentStep, form.formState.errors) && (
                <span className="text-destructive text-xs">(has errors)</span>
              )}
            </div>
            {currentStep < steps.length - 1 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Next:</span>
                <span className="font-medium">
                  {steps[currentStep + 1]?.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Traditional step indicator */}
        <div className="hidden sm:flex justify-between items-center">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center w-full relative"
              onClick={() => {
                // Allow navigation to completed steps or steps with errors
                if (
                  index < currentStep ||
                  stepHasErrors(index, form.formState.errors)
                ) {
                  setCurrentStep(index)
                  window.scrollTo(0, 0)
                }
              }}
              style={{
                cursor:
                  index < currentStep ||
                  stepHasErrors(index, form.formState.errors)
                    ? "pointer"
                    : "default"
              }}
              title={
                stepHasErrors(index, form.formState.errors)
                  ? `${step.title} has validation errors - click to view`
                  : index < currentStep
                    ? `${step.title} (completed) - click to review`
                    : step.title
              }
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-background text-xs font-medium transition-all duration-200",
                  index === currentStep
                    ? "border-primary text-primary ring-2 ring-primary/20"
                    : completedSteps[index]
                      ? "border-primary bg-primary text-white"
                      : stepHasErrors(index, form.formState.errors)
                        ? "border-destructive text-destructive ring-2 ring-destructive/20"
                        : index < currentStep
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                )}
                aria-current={index === currentStep ? "step" : undefined}
              >
                {completedSteps[index] ? (
                  <Check className="w-4 h-4" />
                ) : stepHasErrors(index, form.formState.errors) ? (
                  <span className="text-destructive">!</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div
                className={cn(
                  "mt-2 text-xs text-center font-medium max-w-16 leading-tight",
                  index === currentStep
                    ? "text-primary"
                    : stepHasErrors(index, form.formState.errors)
                      ? "text-destructive"
                      : index < currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5 transition-all duration-300",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderStepIndicator()}

      <div className="p-4 sm:p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight border-b pb-2 mb-6">
          {steps[currentStep]?.title || "Form Section"}
        </h2>
        {/* The actual form component for the current step is rendered by the parent 
            and passed here as currentStepContent (from children props) 
            The <Form> from shadcn is used in the parent where form methods are directly available.
            Here, we display the content. The parent will wrap this in <Form> and pass form instance.
        */}
        <div className="space-y-6">{currentStepContent}</div>
      </div>

      {/* Mobile-optimized button layout */}
      <div className="pt-6 space-y-4 sm:space-y-0">
        {/* Mobile: Stacked buttons for better touch targets */}
        <div className="block sm:hidden space-y-3">
          {!isLastStep ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isSavingDraft}
              className="w-full h-12 text-base"
              size="lg"
            >
              Continue to {steps[currentStep + 1]?.title}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={async () => {
                const isValid = await form.trigger()
                if (isValid) {
                  form.handleSubmit(onSubmit)()
                } else {
                  // Find which step has errors and navigate there
                  const errors = form.formState.errors
                  const errorStep = findStepWithErrors(errors)

                  // Count steps with errors for better user feedback
                  const stepsWithErrors = steps.filter((_, index) =>
                    stepHasErrors(index, errors)
                  ).length

                  if (errorStep !== -1 && errorStep !== currentStep) {
                    setCurrentStep(errorStep)
                    toast.error(
                      `${stepsWithErrors} step${stepsWithErrors > 1 ? "s have" : " has"} errors. Navigating to "${steps[errorStep]?.title}" to fix them.`
                    )
                    window.scrollTo(0, 0)
                  } else {
                    const currentStepErrors = stepHasErrors(currentStep, errors)
                    if (currentStepErrors) {
                      toast.error(
                        `Please correct the errors in the current step before submitting.`
                      )
                    } else {
                      toast.error(
                        `${stepsWithErrors} step${stepsWithErrors > 1 ? "s have" : " has"} validation errors. Please review all steps.`
                      )
                    }
                  }
                }
              }}
              disabled={isSubmitting || isSavingDraft}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Metadata Record"
              )}
            </Button>
          )}

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting || isSavingDraft}
                className="flex-1 h-11"
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={handleInternalSaveDraft}
              disabled={isSubmitting || isSavingDraft}
              className="flex-1 h-11"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </Button>
          </div>
        </div>

        {/* Desktop: Original horizontal layout */}
        <div className="hidden sm:flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting || isSavingDraft}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleInternalSaveDraft}
              disabled={isSubmitting || isSavingDraft}
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </Button>

            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || isSavingDraft}
                className="w-full h-12 text-base"
                size="lg"
              >
                Continue to {steps[currentStep + 1]?.title}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={async () => {
                  const isValid = await form.trigger()
                  if (isValid) {
                    form.handleSubmit(onSubmit)()
                  } else {
                    // Find which step has errors and navigate there
                    const errors = form.formState.errors
                    const errorStep = findStepWithErrors(errors)

                    if (errorStep !== -1 && errorStep !== currentStep) {
                      setCurrentStep(errorStep)
                      toast.error(
                        `Please correct the errors in "${steps[errorStep]?.title}" before submitting.`
                      )
                      window.scrollTo(0, 0)
                    } else {
                      toast.error(
                        "Please correct the errors before submitting."
                      )
                    }
                  }
                }}
                disabled={isSubmitting || isSavingDraft}
                className="w-full h-12 text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Metadata Record"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
