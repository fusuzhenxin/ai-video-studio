"use client";

import React, { useEffect, useState } from "react";
import { Brain, Sparkles, Users, ImageIcon, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useProject } from "@/context/ProjectContext";
import { useProviders } from "@/context/ProviderContext";
import { CharacterProfile, BackgroundAsset } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { apiAnalyzeContent, apiGenerateImage } from "@/lib/api-client";
import { TEXT_PROVIDERS, IMAGE_PROVIDERS } from "@/lib/providers/types";

interface AnalyzingStepProps {
  onNext: () => void;
}

const ANALYSIS_STAGES = [
  { label: "GPT 正在解析内容语义...", icon: Brain },
  { label: "识别角色与人物特征...", icon: Users },
  { label: "DALL·E 生成角色与背景图片...", icon: ImageIcon },
  { label: "构建素材资源库...", icon: Sparkles },
];

export function AnalyzingStep({ onNext }: AnalyzingStepProps) {
  const { project, setCharacters, setBackgrounds, setStoryboard, setStatus } = useProject();
  const { config } = useProviders();
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detailLog, setDetailLog] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer so user knows the process is still alive
  useEffect(() => {
    if (error || progress >= 100) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [error, progress]);

  const addLog = (msg: string) => setDetailLog((prev) => [...prev, msg]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus("analyzing");
      setError(null);

      try {
        // === Stage 1: LLM Content Analysis ===
        setStageIndex(0);
        setProgress(5);
        addLog(`调用 ${TEXT_PROVIDERS[config.text].name} 分析文本内容...`);

        const text =
          project.rawText ||
          project.uploadedImages.map((img) => img.name).join("，");

        const analysis = await apiAnalyzeContent(text, config.text);
        if (cancelled) return;

        addLog(`分析完成：${analysis.characters.length} 个角色, ${analysis.backgrounds.length} 个场景, ${analysis.scenes.length} 个分镜`);
        setProgress(30);

        // === Stage 2: Generate Character Images ===
        setStageIndex(1);
        addLog(`使用 ${IMAGE_PROVIDERS[config.image].name} 生成角色图片...`);

        const characters: CharacterProfile[] = [];
        for (let i = 0; i < analysis.characters.length; i++) {
          if (cancelled) return;
          const c = analysis.characters[i];
          addLog(`生成角色图片 (${i + 1}/${analysis.characters.length}): ${c.name}`);
          let imageUrl = "";
          try {
            imageUrl = await apiGenerateImage(c.imagePrompt, "1024x1024", config.image);
          } catch (imgErr) {
            addLog(`⚠ 角色 "${c.name}" 图片生成失败，使用占位图`);
            imageUrl = `https://placehold.co/512x512/27272a/a1a1aa?text=${encodeURIComponent(c.name)}`;
          }
          characters.push({
            id: uuidv4(),
            name: c.name,
            description: c.description,
            appearance: c.appearance,
            imagePrompt: c.imagePrompt,
            imageUrl,
            tags: c.tags,
          });
          setProgress(30 + ((i + 1) / analysis.characters.length) * 20);
        }
        if (cancelled) return;
        setCharacters(characters);

        // === Stage 3: Generate Background Images ===
        setStageIndex(2);
        addLog(`使用 ${IMAGE_PROVIDERS[config.image].name} 生成场景背景图片...`);

        const backgrounds: BackgroundAsset[] = [];
        for (let i = 0; i < analysis.backgrounds.length; i++) {
          if (cancelled) return;
          const b = analysis.backgrounds[i];
          addLog(`生成背景图片 (${i + 1}/${analysis.backgrounds.length}): ${b.name}`);
          let imageUrl = "";
          try {
            imageUrl = await apiGenerateImage(b.imagePrompt, "1792x1024", config.image);
          } catch (imgErr) {
            addLog(`⚠ 场景 "${b.name}" 图片生成失败，使用占位图`);
            imageUrl = `https://placehold.co/896x512/27272a/a1a1aa?text=${encodeURIComponent(b.name)}`;
          }
          backgrounds.push({
            id: uuidv4(),
            name: b.name,
            description: b.description,
            imagePrompt: b.imagePrompt,
            imageUrl,
            tags: b.tags,
          });
          setProgress(50 + ((i + 1) / analysis.backgrounds.length) * 20);
        }
        if (cancelled) return;
        setBackgrounds(backgrounds);

        // === Stage 4: Prepare Storyboard Scenes (images generated later in StoryboardStep) ===
        setStageIndex(3);
        addLog("组装分镜脚本数据...");

        // Map character/background names to IDs
        const charMap = new Map(characters.map((c) => [c.name, c.id]));
        const bgMap = new Map(backgrounds.map((b) => [b.name, b.id]));

        const scenes = analysis.scenes.map((s) => ({
          id: uuidv4(),
          order: s.order,
          sceneDescription: s.sceneDescription,
          characterAction: s.characterAction,
          cameraAngle: s.cameraAngle,
          duration: s.duration,
          dialogues: s.dialogues,
          characterIds: s.characterNames
            .map((name) => charMap.get(name))
            .filter(Boolean) as string[],
          characterNames: s.characterNames,
          backgroundId: bgMap.get(s.backgroundName) || backgrounds[0]?.id || "",
          backgroundName: s.backgroundName,
          imagePrompt: s.imagePrompt,
          previewUrl: "", // will be generated in StoryboardStep
          status: "pending" as const,
        }));
        setStoryboard(scenes);

        setProgress(100);
        addLog("✓ 分析完成！即将进入资源库预览...");

        setTimeout(() => {
          if (!cancelled) onNext();
        }, 800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "分析失败";
        setError(msg);
        addLog(`✗ 错误: ${msg}`);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CurrentIcon = ANALYSIS_STAGES[stageIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center animate-pulse-glow">
        <CurrentIcon size={36} className="text-white" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          {error ? "分析出错" : "AI 智能分析中"}
        </h2>
        <p className="text-[var(--muted-foreground)]">
          {error ? error : ANALYSIS_STAGES[stageIndex].label}
        </p>
        {!error && progress < 100 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            已用时 {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            {elapsed > 10 && progress <= 5 && " — 大模型正在思考中，请耐心等待（通常需要 30~90 秒）"}
          </p>
        )}
      </div>

      {error && (
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm text-red-300 max-w-md text-center">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      )}

      {!error && (
        <div className="w-full max-w-md">
          <ProgressBar value={progress} label="分析进度" />
        </div>
      )}

      {/* Stage indicators */}
      <div className="flex gap-6 text-sm text-[var(--muted-foreground)]">
        {ANALYSIS_STAGES.map((stage, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 transition-colors ${
              i <= stageIndex ? "text-[var(--primary)]" : ""
            }`}
          >
            <stage.icon size={14} />
            <span className="hidden sm:inline">{stage.label.replace("...", "").replace("GPT ", "").replace("DALL·E ", "")}</span>
          </div>
        ))}
      </div>

      {/* Detail log */}
      <div className="w-full max-w-lg bg-[var(--secondary)] rounded-lg p-4 max-h-48 overflow-y-auto border border-[var(--border)]">
        <p className="text-xs text-[var(--muted-foreground)] mb-2 font-medium">执行日志</p>
        {detailLog.map((log, i) => (
          <p key={i} className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            <span className="text-[var(--primary)]">›</span> {log}
          </p>
        ))}
        {detailLog.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">等待启动...</p>
        )}
      </div>
    </div>
  );
}
