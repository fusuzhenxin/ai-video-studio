"use client";

import Link from "next/link";
import {
  Film,
  Sparkles,
  ImagePlus,
  Type,
  BookOpen,
  Clapperboard,
  Wand2,
  Video,
  ArrowRight,
  Zap,
  Brain,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: ImagePlus,
    title: "多元素材输入",
    desc: "支持图片上传、文本描述、小说剧情三种输入方式",
  },
  {
    icon: Brain,
    title: "AI 智能分析",
    desc: "自动识别角色、场景，生成匹配的人物与背景资源",
  },
  {
    icon: Clapperboard,
    title: "分镜脚本生成",
    desc: "智能拆分内容为分镜，包含场景、动作、镜头角度",
  },
  {
    icon: Wand2,
    title: "分镜视频生成",
    desc: "基于脚本和素材自动生成每个分镜的视频片段",
  },
  {
    icon: Layers,
    title: "智能视频合成",
    desc: "自动将所有分镜片段整合为完整流畅的视频作品",
  },
  {
    icon: Zap,
    title: "预览与调整",
    desc: "全程可视化操作，支持实时预览和灵活编辑调整",
  },
];

const WORKFLOW_STEPS = [
  { num: "01", title: "输入素材", desc: "上传图片、输入文本或粘贴小说" },
  { num: "02", title: "AI 分析", desc: "智能识别角色与场景元素" },
  { num: "03", title: "编辑分镜", desc: "查看和调整自动生成的分镜脚本" },
  { num: "04", title: "生成视频", desc: "AI 合成完整视频作品" },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
              <Sparkles size={14} />
              AI 驱动的智能视频创作平台
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] leading-tight">
              文字变视频
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                创意无限可能
              </span>
            </h1>

            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              通过上传图片、输入文本描述或粘贴小说剧情，AI
              将自动分析内容、生成分镜脚本、创建视频片段，
              最终合成一部完整的视频作品。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/create">
                <Button size="lg" className="text-base px-8">
                  <Film size={20} />
                  开始创作
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8">
                <Video size={20} />
                查看示例
              </Button>
            </div>
          </div>

          {/* Input mode showcase */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: ImagePlus, label: "图片生成", color: "from-pink-500 to-rose-500" },
              { icon: Type, label: "文本生成", color: "from-violet-500 to-purple-500" },
              { icon: BookOpen, label: "小说生成", color: "from-blue-500 to-indigo-500" },
            ].map(({ icon: Icon, label, color }) => (
              <Link href="/create" key={label}>
                <Card hover className="text-center py-8">
                  <div
                    className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                  <p className="font-semibold text-[var(--foreground)]">{label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">
              四步完成视频创作
            </h2>
            <p className="text-[var(--muted-foreground)] mt-3">
              从素材输入到视频输出，全程智能化自动化
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.num} className="relative">
                <Card className="h-full">
                  <span className="text-4xl font-bold bg-gradient-to-b from-purple-400/40 to-transparent bg-clip-text text-transparent">
                    {step.num}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mt-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {step.desc}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">
              强大的核心功能
            </h2>
            <p className="text-[var(--muted-foreground)] mt-3">
              涵盖视频创作全流程的智能化工具
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} hover>
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[var(--primary)]" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">
            准备好创建您的视频了吗？
          </h2>
          <p className="text-[var(--muted-foreground)]">
            只需几分钟，即可将您的创意转化为精彩的视频作品
          </p>
          <Link href="/create">
            <Button size="lg" className="text-base px-10 mt-4">
              <Sparkles size={20} />
              立即开始
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Film size={16} className="text-[var(--primary)]" />
            <span>AI视界 · 智能视频生成平台</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
}
