"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: string;
  label: string;
  completed?: boolean;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

export function StepProgress({
  steps,
  currentStep,
  className,
}: StepProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.completed || index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div
              className={cn(
                "step-indicator",
                isActive && "active",
                isCompleted && "completed",
                !isActive && !isCompleted && "inactive"
              )}
            >
              {isCompleted ? (
                <Check size={16} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Connecting Line */}
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 w-8 md:w-12 transition-all",
                  isCompleted
                    ? "bg-green-500"
                    : "bg-white/10"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
