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
            <Separator orientation="vertical" className="h-4" />
            <div className="flex-1">
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

        {/* Step progress bar */}
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div
              key={step.id} // Use step.id as key
              className="flex flex-col items-center w-full relative"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-background text-xs font-medium transition-all duration-200",
                  index === currentStep
                    ? "border-primary text-primary ring-2 ring-primary/20"
                    : completedSteps[index] // This logic might need adjustment based on validation
                      ? "border-primary bg-primary text-white"
                      : index < currentStep
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                )}
                aria-current={index === currentStep ? "step" : undefined}
              >
                {completedSteps[index] ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div
                className={cn(
                  "mt-2 text-xs text-center font-medium max-w-16 leading-tight",
                  index === currentStep
                    ? "text-primary"
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

      <div className="p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-xl font-semibold tracking-tight border-b pb-2">
          {steps[currentStep]?.title || "Form Section"}
        </h2>
        {/* The actual form component for the current step is rendered by the parent 
            and passed here as currentStepContent (from children props) 
            The <Form> from shadcn is used in the parent where form methods are directly available.
            Here, we display the content. The parent will wrap this in <Form> and pass form instance.
        */}
        {currentStepContent}
      </div>

      <div className="flex justify-between items-center pt-6">
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
            onClick={handleInternalSaveDraft} // Use internal handler that calls prop
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
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={async () => {
                // Validation should be triggered by react-hook-form's handleSubmit
                // in the parent. This button click should just call onSubmit prop.
                const isValid = await form.trigger() // Optionally trigger validation here for all fields
                if (isValid) {
                  form.handleSubmit(onSubmit)() // Call the main form submission
                } else {
                  toast.error("Please correct the errors before submitting.")
                }
              }}
              disabled={isSubmitting || isSavingDraft}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
