"use client";

import React, { useState } from "react";
import { Settings2, ArrowRight } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { useProviders } from "@/context/ProviderContext";
import { Stepper } from "@/components/ui/Stepper";
import { ModelSelector } from "@/components/ui/ModelSelector";
import { Button } from "@/components/ui/Button";
import { InputStep } from "@/components/steps/InputStep";
import { AnalyzingStep } from "@/components/steps/AnalyzingStep";
import { ResourceStep } from "@/components/steps/ResourceStep";
import { StoryboardStep } from "@/components/steps/StoryboardStep";
import { VideoGenStep } from "@/components/steps/VideoGenStep";
import { FinalStep } from "@/components/steps/FinalStep";
import {
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  VIDEO_PROVIDERS,
} from "@/lib/providers/types";

const STEPS = [
  { label: "模型选择" },
  { label: "素材输入" },
  { label: "AI分析" },
  { label: "资源库" },
  { label: "分镜脚本" },
  { label: "视频生成" },
  { label: "完成" },
];

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { resetProject } = useProject();
  const { config } = useProviders();

  const goTo = (step: number) => setCurrentStep(step);

  const handleRestart = () => {
    resetProject();
    setCurrentStep(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stepper */}
      <div className="mb-10 max-w-4xl mx-auto">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div>
        {/* Step 0: Model Selection */}
        {currentStep === 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                <Settings2 size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">选择 AI 模型</h2>
              <p className="text-[var(--muted-foreground)] text-sm">
                为每个环节选择您偏好的 AI 大模型，支持混合搭配不同厂商
              </p>
            </div>

            <ModelSelector />

            {/* Current selection summary */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="px-2 py-1 rounded-full bg-[var(--secondary)] border border-[var(--border)]">
                📝 {TEXT_PROVIDERS[config.text].name}
              </span>
              <span>+</span>
              <span className="px-2 py-1 rounded-full bg-[var(--secondary)] border border-[var(--border)]">
                🎨 {IMAGE_PROVIDERS[config.image].name}
              </span>
              <span>+</span>
              <span className="px-2 py-1 rounded-full bg-[var(--secondary)] border border-[var(--border)]">
                🎬 {VIDEO_PROVIDERS[config.video].name}
              </span>
            </div>

            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={() => goTo(1)}>
                确认并开始创作
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <InputStep onNext={() => goTo(2)} />
        )}
        {currentStep === 2 && (
          <AnalyzingStep onNext={() => goTo(3)} />
        )}
        {currentStep === 3 && (
          <ResourceStep
            onNext={() => goTo(4)}
            onBack={() => goTo(1)}
          />
        )}
        {currentStep === 4 && (
          <StoryboardStep
            onNext={() => goTo(5)}
            onBack={() => goTo(3)}
          />
        )}
        {currentStep === 5 && (
          <VideoGenStep
            onNext={() => goTo(6)}
            onBack={() => goTo(4)}
          />
        )}
        {currentStep === 6 && (
          <FinalStep onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}
