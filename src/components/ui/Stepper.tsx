"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shrink-0",
                  isCompleted &&
                    "bg-[var(--primary)] text-white shadow-lg shadow-purple-500/30",
                  isCurrent &&
                    "bg-[var(--primary)] text-white animate-pulse-glow",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]"
                )}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs text-center whitespace-nowrap",
                  isCurrent
                    ? "text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)]"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 mt-[-20px]">
                <div
                  className={cn(
                    "h-0.5 rounded-full transition-all duration-500",
                    index < currentStep
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--border)]"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
