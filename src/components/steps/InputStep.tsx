"use client";

import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Upload,
  FileText,
  BookOpen,
  ImagePlus,
  X,
  Type,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputMode } from "@/types";

const INPUT_MODES: { mode: InputMode; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    mode: "image",
    icon: <ImagePlus size={24} />,
    title: "上传图片",
    desc: "上传参考图片，AI将分析图片内容生成视频",
  },
  {
    mode: "text",
    icon: <Type size={24} />,
    title: "文本描述",
    desc: "输入视频场景描述，AI将根据文字生成视频",
  },
  {
    mode: "novel",
    icon: <BookOpen size={24} />,
    title: "小说剧情",
    desc: "粘贴小说片段，AI将自动拆分并生成分镜视频",
  },
];

interface InputStepProps {
  onNext: () => void;
}

export function InputStep({ onNext }: InputStepProps) {
  const {
    project,
    setInputMode,
    setRawText,
    addImages,
    removeImage,
    setProjectName,
  } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList) => {
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: uuidv4(),
        name: f.name,
        url: URL.createObjectURL(f),
        file: f,
      }));
    if (newImages.length > 0) addImages(newImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const canProceed =
    (project.inputMode === "image" && project.uploadedImages.length > 0) ||
    ((project.inputMode === "text" || project.inputMode === "novel") &&
      project.rawText.trim().length > 20);

  return (
    <div className="space-y-8">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
          项目名称
        </label>
        <input
          type="text"
          value={project.name}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
          placeholder="输入项目名称..."
        />
      </div>

      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-3">
          选择素材输入方式
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {INPUT_MODES.map(({ mode, icon, title, desc }) => (
            <Card
              key={mode}
              hover
              className={
                project.inputMode === mode
                  ? "border-[var(--primary)] bg-purple-500/5 shadow-lg shadow-purple-500/10"
                  : ""
              }
              onClick={() => setInputMode(mode)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    project.inputMode === mode
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  } transition-all`}
                >
                  {icon}
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--foreground)]">
                    {title}
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Input Area */}
      <div>
        {project.inputMode === "image" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-[var(--primary)] bg-purple-500/10"
                  : "border-[var(--border)] hover:border-[var(--primary)]/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                size={40}
                className="mx-auto mb-3 text-[var(--muted-foreground)]"
              />
              <p className="text-[var(--foreground)] font-medium">
                拖拽图片到此处或点击上传
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                支持 JPG, PNG, WebP 格式
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {project.uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {project.uploadedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden aspect-square border border-[var(--border)]"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">{img.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {project.inputMode === "text" && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              <FileText size={14} className="inline mr-1" />
              输入视频场景描述
            </label>
            <textarea
              value={project.rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all resize-none"
              placeholder="描述你想要的视频场景，例如：&#10;清晨的阳光洒在古老的城镇上，一位身着青衫的少年站在石桥上，望着远方的群山..."
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              已输入 {project.rawText.length} 字 · 建议至少 50 字以获得更好的效果
            </p>
          </div>
        )}

        {project.inputMode === "novel" && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              <BookOpen size={14} className="inline mr-1" />
              粘贴小说/剧情片段
            </label>
            <textarea
              value={project.rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all resize-none"
              placeholder="粘贴小说片段或剧情内容，系统将自动拆分为分镜脚本...&#10;&#10;例如：&#10;天色渐暗，林晓独自一人走在回家的路上。他紧了紧衣领，脑海中还回荡着刚才苏婉说的那番话。街灯一盏一盏亮起来，在湿漉漉的路面上投下橘色的光晕。突然，一道身影从巷口闪出——"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              已输入 {project.rawText.length} 字 · 建议至少 100 字以获得完整的分镜
            </p>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button size="lg" disabled={!canProceed} onClick={onNext}>
          开始智能分析
          <FileText size={18} />
        </Button>
      </div>
    </div>
  );
}
