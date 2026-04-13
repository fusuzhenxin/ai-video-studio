"use client";

import React from "react";
import { useProviders } from "@/context/ProviderContext";
import {
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  VIDEO_PROVIDERS,
  TextProvider,
  ImageProvider,
  VideoProvider,
  ProviderInfo,
} from "@/lib/providers/types";
import { Card } from "@/components/ui/Card";

interface ProviderCardProps {
  info: ProviderInfo;
  selected: boolean;
  onClick: () => void;
}

function ProviderCard({ info, selected, onClick }: ProviderCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-md shadow-purple-500/10"
          : "border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--muted-foreground)]/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{info.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {info.name}
            </span>
            {selected && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white font-medium">
                当前
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
            {info.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function ModelSelector() {
  const {
    config,
    setTextProvider,
    setImageProvider,
    setVideoProvider,
  } = useProviders();

  return (
    <div className="space-y-6">
      {/* Text/Analysis Model */}
      <Card>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
          📝 文本分析模型
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          用于解析文本内容、提取角色、拆分分镜脚本
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.entries(TEXT_PROVIDERS) as [TextProvider, ProviderInfo][]).map(
            ([key, info]) => (
              <ProviderCard
                key={key}
                info={info}
                selected={config.text === key}
                onClick={() => setTextProvider(key)}
              />
            )
          )}
        </div>
      </Card>

      {/* Image Generation Model */}
      <Card>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
          🎨 图片生成模型
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          用于生成角色肖像、场景背景、分镜预览图
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.entries(IMAGE_PROVIDERS) as [ImageProvider, ProviderInfo][]).map(
            ([key, info]) => (
              <ProviderCard
                key={key}
                info={info}
                selected={config.image === key}
                onClick={() => setImageProvider(key)}
              />
            )
          )}
        </div>
      </Card>

      {/* Video Generation Model */}
      <Card>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
          🎬 视频生成模型
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          用于将分镜图片转为视频片段
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.entries(VIDEO_PROVIDERS) as [VideoProvider, ProviderInfo][]).map(
            ([key, info]) => (
              <ProviderCard
                key={key}
                info={info}
                selected={config.video === key}
                onClick={() => setVideoProvider(key)}
              />
            )
          )}
        </div>
      </Card>
    </div>
  );
}
