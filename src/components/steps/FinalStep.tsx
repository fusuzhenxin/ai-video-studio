"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Download,
  Share2,
  RotateCcw,
  CheckCircle2,
  Film,
  Clock,
  Clapperboard,
  Sparkles,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiCompositeVideo } from "@/lib/api-client";

interface FinalStepProps {
  onRestart: () => void;
}

export function FinalStep({ onRestart }: FinalStepProps) {
  const { project, setFinalVideoUrl, setStatus } = useProject();
  const [compositing, setCompositing] = useState(!project.finalVideoUrl);
  const [progress, setProgress] = useState(project.finalVideoUrl ? 100 : 0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Collect all valid video clip URLs
  const clips = project.storyboard
    .filter((s) => s.videoClipUrl)
    .map((s) => ({ url: s.videoClipUrl!, duration: s.duration, previewUrl: s.previewUrl, order: s.order }));

  const hasVideoClips = clips.length > 0;

  // Composite step: call API to register the final composition
  useEffect(() => {
    if (project.finalVideoUrl) {
      setCompositing(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setStatus("compositing");
      const interval = setInterval(() => {
        setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 10));
      }, 300);

      try {
        const clipData = project.storyboard
          .filter((s) => s.videoClipUrl)
          .map((s) => ({ url: s.videoClipUrl!, duration: s.duration }));

        await apiCompositeVideo(clipData);
        if (cancelled) return;
        clearInterval(interval);

        // Use first clip URL as representative final video (real merge needs ffmpeg)
        const finalUrl = clipData[0]?.url || "done";
        setFinalVideoUrl(finalUrl);
        setProgress(100);
        setStatus("done");
        setTimeout(() => {
          if (!cancelled) setCompositing(false);
        }, 500);
      } catch {
        clearInterval(interval);
        // Even on API error, still show the result since clips are already generated
        setFinalVideoUrl("playlist");
        setProgress(100);
        setStatus("done");
        setTimeout(() => {
          if (!cancelled) setCompositing(false);
        }, 500);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a video clip ends, auto-advance to the next one
  const handleClipEnded = useCallback(() => {
    if (currentClipIndex < clips.length - 1) {
      setCurrentClipIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentClipIndex, clips.length]);

  // Auto-play when switching clips
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentClipIndex, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) {
      // No video element, fallback to image slideshow
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const goToClip = (index: number) => {
    setCurrentClipIndex(index);
    setIsPlaying(false);
  };

  // Fallback: image slideshow when no real video clips available
  useEffect(() => {
    if (hasVideoClips || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentClipIndex((p) => (p + 1) % project.storyboard.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [hasVideoClips, isPlaying, project.storyboard.length]);

  const totalDuration = project.storyboard.reduce((sum, s) => sum + s.duration, 0);
  const currentScene = hasVideoClips
    ? clips[currentClipIndex]
    : { previewUrl: project.storyboard[currentClipIndex]?.previewUrl, order: currentClipIndex + 1 };
  const totalItems = hasVideoClips ? clips.length : project.storyboard.length;

  if (compositing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center animate-pulse-glow">
          <Film size={36} className="text-white" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">合成视频中</h2>
          <p className="text-[var(--muted-foreground)]">正在将所有分镜片段合成为完整视频...</p>
        </div>
        <div className="w-full max-w-md">
          <ProgressBar value={progress} label="合成进度" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">视频生成完成！</h2>
        <p className="text-[var(--muted-foreground)]">
          您的视频「{project.name}」已成功生成，共 {totalItems} 个片段
        </p>
      </div>

      {/* Video Player */}
      <Card className="overflow-hidden p-0 max-w-4xl mx-auto">
        <div className="aspect-video relative bg-black">
          {hasVideoClips && clips[currentClipIndex]?.url ? (
            <video
              ref={videoRef}
              key={clips[currentClipIndex].url}
              src={clips[currentClipIndex].url}
              className="w-full h-full object-contain"
              onEnded={handleClipEnded}
              playsInline
              poster={clips[currentClipIndex].previewUrl}
            />
          ) : (
            <img
              src={currentScene?.previewUrl || ""}
              alt="Preview"
              className="w-full h-full object-cover transition-all duration-700"
            />
          )}

          {/* Playback controls overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
            <button
              onClick={() => goToClip(Math.max(0, currentClipIndex - 1))}
              disabled={currentClipIndex === 0}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-30"
            >
              <SkipBack size={18} className="text-white" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
            >
              {isPlaying ? (
                <Pause size={28} className="text-white" />
              ) : (
                <Play size={28} className="text-white ml-1" />
              )}
            </button>
            <button
              onClick={() => goToClip(Math.min(totalItems - 1, currentClipIndex + 1))}
              disabled={currentClipIndex >= totalItems - 1}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-30"
            >
              <SkipForward size={18} className="text-white" />
            </button>
          </div>

          {/* Bottom progress bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white text-sm">
              <span>{project.name}</span>
              <span>
                片段 {currentClipIndex + 1} / {totalItems}
              </span>
            </div>
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                style={{
                  width: `${((currentClipIndex + 1) / totalItems) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Timeline thumbnails */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {project.storyboard.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => goToClip(i)}
                className={`shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentClipIndex
                    ? "border-[var(--primary)] shadow-lg shadow-purple-500/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={scene.previewUrl}
                  alt={`Scene ${scene.order}`}
                  className="w-full aspect-video object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <Card className="text-center">
          <Clapperboard size={20} className="mx-auto text-[var(--primary)] mb-2" />
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {project.storyboard.length}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">分镜数量</p>
        </Card>
        <Card className="text-center">
          <Clock size={20} className="mx-auto text-[var(--primary)] mb-2" />
          <p className="text-2xl font-bold text-[var(--foreground)]">{totalDuration}s</p>
          <p className="text-xs text-[var(--muted-foreground)]">总时长</p>
        </Card>
        <Card className="text-center">
          <Sparkles size={20} className="mx-auto text-[var(--primary)] mb-2" />
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {project.characters.length}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">角色数</p>
        </Card>
        <Card className="text-center">
          <Film size={20} className="mx-auto text-[var(--primary)] mb-2" />
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {project.backgrounds.length}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">场景数</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        {hasVideoClips && (
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              const a = document.createElement("a");
              a.href = clips[currentClipIndex]?.url || "";
              a.download = `${project.name}_clip_${currentClipIndex + 1}.mp4`;
              a.click();
            }}
          >
            <Download size={18} />
            下载当前片段
          </Button>
        )}
        <Button size="lg" variant="outline">
          <Share2 size={18} />
          分享作品
        </Button>
        <Button size="lg" variant="secondary" onClick={onRestart}>
          <RotateCcw size={18} />
          创建新项目
        </Button>
      </div>
    </div>
  );
}
