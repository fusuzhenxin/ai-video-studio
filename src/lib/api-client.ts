import type { AnalysisResult, TextProvider, ImageProvider, VideoProvider } from "@/lib/providers/types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }

  return data as T;
}

// 1. 内容分析：文本 → 角色/背景/分镜
export async function apiAnalyzeContent(
  text: string,
  provider: TextProvider = "openai"
): Promise<AnalysisResult> {
  return post<AnalysisResult>("/api/analyze", { text, provider });
}

// 2. 图片生成：prompt → image URL
export async function apiGenerateImage(
  prompt: string,
  size: string = "1024x1024",
  provider: ImageProvider = "dalle3"
): Promise<string> {
  const data = await post<{ url: string }>("/api/generate-image", { prompt, size, provider });
  return data.url;
}

// 3. 视频生成：image URL → video URL
export async function apiGenerateVideo(
  imageUrl: string,
  provider: VideoProvider = "replicate"
): Promise<string> {
  const data = await post<{ url: string }>("/api/generate-video", { imageUrl, provider });
  return data.url;
}

// 4. 视频合成
export interface CompositeResult {
  result: {
    type: string;
    clips: { url: string; duration: number }[];
    message: string;
  };
}

export async function apiCompositeVideo(
  clips: { url: string; duration: number }[]
): Promise<CompositeResult> {
  return post<CompositeResult>("/api/composite", { clips });
}
