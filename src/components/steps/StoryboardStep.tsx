"use client";

import React, { useEffect, useState } from "react";
import {
  Clapperboard,
  Camera,
  Clock,
  MessageSquare,
  Users,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { useProviders } from "@/context/ProviderContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiGenerateImage } from "@/lib/api-client";

interface StoryboardStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StoryboardStep({ onNext, onBack }: StoryboardStepProps) {
  const { project, updateScene, removeScene, reorderScenes, setStatus } =
    useProject();
  const { config } = useProviders();
  const needsImages = project.storyboard.some((s) => !s.previewUrl);
  const [loading, setLoading] = useState(needsImages);
  const [progress, setProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    sceneDescription: "",
    characterAction: "",
    cameraAngle: "",
    duration: 5,
    dialogues: "",
  });

  // Generate scene preview images via DALL-E for scenes that don't have one
  useEffect(() => {
    if (!needsImages) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setStatus("storyboard");
      const scenesNeedingImages = project.storyboard.filter((s) => !s.previewUrl);
      const total = scenesNeedingImages.length;

      for (let i = 0; i < total; i++) {
        if (cancelled) return;
        const scene = scenesNeedingImages[i];
        setProgress(((i) / total) * 100);

        try {
          const prompt = scene.imagePrompt ||
            `Cinematic film still: ${scene.sceneDescription}, ${scene.cameraAngle}, dramatic lighting, 8k`;
          const imageUrl = await apiGenerateImage(prompt, "1792x1024", config.image);
          if (cancelled) return;
          updateScene(scene.id, { previewUrl: imageUrl });
        } catch {
          // Use placeholder on failure
          const placeholder = `https://placehold.co/896x512/27272a/a1a1aa?text=Scene+${scene.order}`;
          updateScene(scene.id, { previewUrl: placeholder });
        }
      }

      setProgress(100);
      setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 400);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (sceneId: string) => {
    const scene = project.storyboard.find((s) => s.id === sceneId);
    if (!scene) return;
    setEditingId(sceneId);
    setEditFields({
      sceneDescription: scene.sceneDescription,
      characterAction: scene.characterAction,
      cameraAngle: scene.cameraAngle,
      duration: scene.duration,
      dialogues: scene.dialogues,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateScene(editingId, editFields);
    setEditingId(null);
  };

  const moveScene = (index: number, direction: "up" | "down") => {
    const scenes = [...project.storyboard];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= scenes.length) return;
    [scenes[index], scenes[target]] = [scenes[target], scenes[index]];
    reorderScenes(scenes);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center animate-pulse-glow">
          <Clapperboard size={36} className="text-white" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">生成分镜脚本中</h2>
          <p className="text-[var(--muted-foreground)]">AI 正在将内容拆分为逻辑连贯的分镜...</p>
        </div>
        <div className="w-full max-w-md">
          <ProgressBar value={progress} label="生成进度" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">分镜脚本编辑器</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            共 {project.storyboard.length} 个分镜 · 点击编辑按钮可修改分镜内容
          </p>
        </div>
        <Badge variant="primary">
          总时长 {project.storyboard.reduce((sum, s) => sum + s.duration, 0)}s
        </Badge>
      </div>

      <div className="space-y-4">
        {project.storyboard.map((scene, index) => {
          const bg = project.backgrounds.find((b) => b.id === scene.backgroundId);
          const chars = project.characters.filter((c) =>
            scene.characterIds.includes(c.id)
          );
          const isEditing = editingId === scene.id;

          return (
            <Card key={scene.id} className="p-0 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Preview Image */}
                <div className="lg:w-72 shrink-0 relative">
                  <img
                    src={scene.previewUrl}
                    alt={`分镜 ${scene.order}`}
                    className="w-full h-48 lg:h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="primary">#{scene.order}</Badge>
                  </div>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <Badge variant="default">
                      <Clock size={10} className="mr-1" />
                      {scene.duration}s
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-[var(--muted-foreground)] mb-1 block">场景描述</label>
                        <textarea
                          value={editFields.sceneDescription}
                          onChange={(e) => setEditFields({ ...editFields, sceneDescription: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">人物动作</label>
                          <input
                            value={editFields.characterAction}
                            onChange={(e) => setEditFields({ ...editFields, characterAction: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">镜头角度</label>
                          <input
                            value={editFields.cameraAngle}
                            onChange={(e) => setEditFields({ ...editFields, cameraAngle: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">时长 (秒)</label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={editFields.duration}
                            onChange={(e) => setEditFields({ ...editFields, duration: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">台词/对白</label>
                          <input
                            value={editFields.dialogues}
                            onChange={(e) => setEditFields({ ...editFields, dialogues: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}><Check size={14} /> 保存</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X size={14} /> 取消</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--foreground)] leading-relaxed">
                        {scene.sceneDescription}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                          <Users size={13} className="text-[var(--primary)]" />
                          <span>{scene.characterAction}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                          <Camera size={13} className="text-[var(--primary)]" />
                          <span>{scene.cameraAngle}</span>
                        </div>
                        {scene.dialogues && (
                          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                            <MessageSquare size={13} className="text-[var(--primary)]" />
                            <span className="truncate">{scene.dialogues}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {chars.map((c) => (
                          <Badge key={c.id} variant="primary">{c.name}</Badge>
                        ))}
                        {bg && <Badge variant="default">{bg.name}</Badge>}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex lg:flex-col items-center gap-1 p-2 border-t lg:border-t-0 lg:border-l border-[var(--border)]">
                    <button
                      onClick={() => moveScene(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveScene(index, "down")}
                      disabled={index === project.storyboard.length - 1}
                      className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => startEdit(scene.id)}
                      className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => removeScene(scene.id)}
                      className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack}>
          返回资源库
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={project.storyboard.length === 0}
        >
          生成分镜视频
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
