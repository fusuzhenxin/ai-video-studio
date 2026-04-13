"use client";

import React, { useEffect, useState } from "react";
import {
  Film,
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { useProviders } from "@/context/ProviderContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiGenerateVideo } from "@/lib/api-client";

interface VideoGenStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VideoGenStep({ onNext, onBack }: VideoGenStepProps) {
  const { project, updateScene, setStatus } = useProject();
  const { config } = useProviders();
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const totalScenes = project.storyboard.length;
  const doneScenes = project.storyboard.filter((s) => s.status === "done").length;
  const allDone = doneScenes === totalScenes;
  const progress = totalScenes > 0 ? (doneScenes / totalScenes) * 100 : 0;

  useEffect(() => {
    if (allDone) return;
    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGeneration = async () => {
    setGenerating(true);
    setStatus("generating");

    for (let i = 0; i < project.storyboard.length; i++) {
      const scene = project.storyboard[i];
      if (scene.status === "done") continue;

      setCurrentIndex(i);
      updateScene(scene.id, { status: "generating" });

      try {
        const clipUrl = await apiGenerateVideo(scene.previewUrl, config.video);
        updateScene(scene.id, { status: "done", videoClipUrl: clipUrl });
      } catch {
        updateScene(scene.id, { status: "error" });
      }
    }

    setGenerating(false);
    setCurrentIndex(-1);
  };

  const retryScene = async (sceneId: string) => {
    updateScene(sceneId, { status: "generating" });
    try {
      const scene = project.storyboard.find((s) => s.id === sceneId);
      if (!scene) throw new Error("Scene not found");
      const clipUrl = await apiGenerateVideo(scene.previewUrl, config.video);
      updateScene(sceneId, { status: "done", videoClipUrl: clipUrl });
    } catch {
      updateScene(sceneId, { status: "error" });
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 size={18} className="text-green-400" />;
      case "generating":
        return <Loader2 size={18} className="text-[var(--primary)] animate-spin" />;
      case "error":
        return <AlertCircle size={18} className="text-red-400" />;
      default:
        return <Film size={18} className="text-[var(--muted-foreground)]" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "done": return "success" as const;
      case "generating": return "warning" as const;
      case "error": return "error" as const;
      default: return "default" as const;
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case "done": return "已完成";
      case "generating": return "生成中";
      case "error": return "失败";
      default: return "等待中";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with overall progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">分镜视频生成</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {generating
              ? `正在生成第 ${currentIndex + 1} / ${totalScenes} 个分镜视频...`
              : allDone
              ? "所有分镜视频已生成完毕！"
              : `已完成 ${doneScenes} / ${totalScenes} 个`}
          </p>
        </div>
        <Badge variant={allDone ? "success" : generating ? "warning" : "default"}>
          {allDone ? "全部完成" : generating ? "生成中..." : "就绪"}
        </Badge>
      </div>

      <ProgressBar value={progress} label="整体进度" />

      {/* Scene grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {project.storyboard.map((scene, index) => (
          <Card
            key={scene.id}
            className={`p-0 overflow-hidden transition-all ${
              currentIndex === index ? "ring-2 ring-[var(--primary)] animate-pulse-glow" : ""
            }`}
          >
            <div className="aspect-video relative bg-[var(--secondary)]">
              {scene.status === "done" && scene.videoClipUrl ? (
                <video
                  src={scene.videoClipUrl}
                  poster={scene.previewUrl}
                  className="w-full h-full object-cover"
                  playsInline
                  controls
                  muted
                />
              ) : (
                <img
                  src={scene.previewUrl}
                  alt={`分镜 ${scene.order}`}
                  className={`w-full h-full object-cover transition-opacity ${
                    scene.status === "done" ? "opacity-100" : "opacity-60"
                  }`}
                />
              )}
              {scene.status === "generating" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge variant="primary">#{scene.order}</Badge>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusIcon(scene.status)}
                  <Badge variant={statusLabel(scene.status)}>
                    {statusText(scene.status)}
                  </Badge>
                </div>
                {scene.status === "error" && (
                  <button
                    onClick={() => retryScene(scene.id)}
                    className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-2 line-clamp-2">
                {scene.sceneDescription}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack} disabled={generating}>
          返回编辑分镜
        </Button>
        <Button size="lg" onClick={onNext} disabled={!allDone}>
          合成完整视频
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
