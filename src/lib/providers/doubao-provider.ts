import OpenAI from "openai";
import { ITextProvider, IImageProvider, IVideoProvider, AnalysisResult } from "./types";
import { ANALYSIS_SYSTEM_PROMPT } from "./prompts";

// ============ 豆包 Text Provider (Volcengine Ark API, OpenAI compatible) ============

export class DoubaoTextProvider implements ITextProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.VOLCENGINE_API_KEY;
    if (!apiKey) throw new Error("VOLCENGINE_API_KEY 未配置");
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.VOLCENGINE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3",
    });
    // 豆包模型使用 endpoint ID (ep-xxx) 或模型名
    this.model = process.env.DOUBAO_MODEL || "doubao-pro-256k";
  }

  async analyze(text: string): Promise<AnalysisResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("豆包返回空响应");

    // 豆包可能返回带 markdown 代码块的 JSON，清理它
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(jsonStr) as AnalysisResult;
    if (!parsed.characters?.length) throw new Error("未提取到角色");
    if (!parsed.backgrounds?.length) throw new Error("未提取到场景");
    if (!parsed.scenes?.length) throw new Error("未提取到分镜");
    return parsed;
  }
}

// ============ 即梦 Image Provider (Volcengine API) ============

interface JimengSubmitResponse {
  code: number;
  data: {
    task_id: string;
  };
  message: string;
}

interface JimengResultResponse {
  code: number;
  data: {
    task_id: string;
    status: "submitted" | "processing" | "done" | "failed";
    images?: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
  message: string;
}

export class JimengImageProvider implements IImageProvider {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    const apiKey = process.env.JIMENG_API_KEY;
    if (!apiKey) throw new Error("JIMENG_API_KEY 未配置（即梦 API Key）");
    this.apiKey = apiKey;
    this.baseURL = process.env.JIMENG_BASE_URL || "https://jimeng.jianying.com/mweb/v1";
  }

  async generateImage(prompt: string, size: string = "1024x1024"): Promise<string> {
    const [w, h] = size.split("x").map(Number);
    const width = w || 1024;
    const height = h || 1024;

    // Step 1: Submit generation task
    const submitRes = await fetch(`${this.baseURL}/text2img`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
        model: process.env.JIMENG_IMAGE_MODEL || "jimeng-2.1",
        num: 1,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`即梦提交任务失败: ${errText}`);
    }

    const submitData = (await submitRes.json()) as JimengSubmitResponse;
    if (submitData.code !== 0) {
      throw new Error(`即梦提交失败: ${submitData.message}`);
    }

    const taskId = submitData.data?.task_id;
    if (!taskId) throw new Error("即梦未返回 task_id");

    // Step 2: Poll for result
    const maxWait = 120_000;
    const pollInterval = 3_000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, pollInterval));

      const resultRes = await fetch(`${this.baseURL}/task/${taskId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!resultRes.ok) continue;

      const resultData = (await resultRes.json()) as JimengResultResponse;
      const status = resultData.data?.status;

      if (status === "done") {
        const url = resultData.data?.images?.[0]?.url;
        if (!url) throw new Error("即梦未返回图片 URL");
        return url;
      }

      if (status === "failed") {
        throw new Error(`即梦图片生成失败: ${resultData.message}`);
      }
    }

    throw new Error("即梦图片生成超时");
  }
}

// ============ 豆包 Seedream Image Provider (Volcengine Ark API, OpenAI compatible) ============

export class DoubaoImageProvider implements IImageProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    const apiKey = process.env.VOLCENGINE_API_KEY;
    if (!apiKey) throw new Error("VOLCENGINE_API_KEY 未配置（豆包图片生成需要火山引擎 API Key）");
    this.apiKey = apiKey;
    this.baseURL = process.env.VOLCENGINE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
    this.model = process.env.DOUBAO_IMAGE_MODEL || "doubao-seedream-4-5-251128";
  }

  // Seedream 要求至少 3686400 像素 (≈1920x1920)
  // 使用官方推荐的 "2K" 或高分辨率尺寸
  private static SIZE_MAP: Record<string, string> = {
    "1024x1024": "1920x1920",
    "1792x1024": "2560x1440",
    "1024x1792": "1440x2560",
    "512x512":   "1920x1920",
  };

  async generateImage(prompt: string, size: string = "1024x1024"): Promise<string> {
    const mappedSize = DoubaoImageProvider.SIZE_MAP[size] || "1920x1920";
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[DoubaoImage] 生成图片 (attempt ${attempt}), model=${this.model}, size=${mappedSize}: "${prompt.substring(0, 50)}..."`);

        const res = await fetch(`${this.baseURL}/images/generations`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            prompt,
            size: mappedSize,
            response_format: "url",
            n: 1,
            watermark: false,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          if ((errText.includes("Throttling") || errText.includes("rate")) && attempt < maxRetries) {
            const wait = attempt * 5;
            console.warn(`[DoubaoImage] 限流，等待 ${wait}s 后重试 (${attempt}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, wait * 1000));
            continue;
          }
          console.error(`[DoubaoImage] 请求失败: ${res.status} ${errText}`);
          throw new Error(`豆包图片生成失败 (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const url = data?.data?.[0]?.url;
        if (!url) {
          console.error("[DoubaoImage] 未返回图片 URL:", JSON.stringify(data).substring(0, 300));
          throw new Error("豆包图片生成未返回 URL");
        }

        console.log(`[DoubaoImage] ✓ 图片生成成功`);
        return url;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if ((msg.includes("Throttling") || msg.includes("rate")) && attempt < maxRetries) {
          const wait = attempt * 5;
          console.warn(`[DoubaoImage] 限流，等待 ${wait}s 后重试 (${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait * 1000));
          continue;
        }
        if (attempt === maxRetries) throw err;
      }
    }
    throw new Error("豆包图片生成失败: 多次重试仍然失败");
  }
}

// ============ 豆包 Seedance Video Provider (Volcengine Ark API) ============
// 图生视频：POST /contents/generations/tasks → 轮询 GET /contents/generations/tasks/{id}

interface SeedanceTaskCreateResponse {
  id: string;
  model: string;
  status: string;
  error?: { code: string; message: string };
}

interface SeedanceTaskQueryResponse {
  id: string;
  model: string;
  status: string; // "running" | "succeeded" | "failed"
  // content 结构可能是数组或对象，用 unknown 接收后手动解析
  content?: unknown;
  error?: { code: string; message: string };
}

export class DoubaoVideoProvider implements IVideoProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    const apiKey = process.env.VOLCENGINE_API_KEY;
    if (!apiKey) throw new Error("VOLCENGINE_API_KEY 未配置（豆包视频生成需要火山引擎 API Key）");
    this.apiKey = apiKey;
    this.baseURL = process.env.VOLCENGINE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
    this.model = process.env.DOUBAO_VIDEO_MODEL || "doubao-seedance-1-5-pro-251215";
  }

  async generateVideo(imageUrl: string): Promise<string> {
    // Step 1: 提交图生视频任务
    const submitRes = await fetch(`${this.baseURL}/contents/generations/tasks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        content: [
          {
            type: "text",
            text: "根据此图片生成流畅自然的视频动画 --duration 5 --camerafixed false --watermark false",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("[DoubaoVideo] 提交失败:", submitRes.status, errText);
      throw new Error(`豆包视频提交失败 (${submitRes.status}): ${errText}`);
    }

    const submitData = (await submitRes.json()) as SeedanceTaskCreateResponse;
    const taskId = submitData.id;
    if (!taskId) {
      console.error("[DoubaoVideo] 未返回 task id:", JSON.stringify(submitData));
      throw new Error("豆包视频未返回任务 ID");
    }

    console.log(`[DoubaoVideo] 任务已提交: ${taskId}, model: ${this.model}`);

    // Step 2: 轮询任务状态 (最长 5 分钟)
    const maxWait = 300_000;
    const pollInterval = 5_000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, pollInterval));

      const queryRes = await fetch(`${this.baseURL}/contents/generations/tasks/${taskId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!queryRes.ok) {
        console.warn(`[DoubaoVideo] 轮询失败: ${queryRes.status}`);
        continue;
      }

      const queryData = (await queryRes.json()) as SeedanceTaskQueryResponse;
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`[DoubaoVideo] 任务 ${taskId} 状态: ${queryData.status} (${elapsed}s)`);

      if (queryData.status === "succeeded") {
        console.log("[DoubaoVideo] 成功响应:", JSON.stringify(queryData).substring(0, 500));
        const videoUrl = this.extractVideoUrl(queryData.content);
        if (!videoUrl) {
          console.error("[DoubaoVideo] 成功但未找到视频 URL:", JSON.stringify(queryData).substring(0, 500));
          throw new Error("豆包视频生成成功但未返回视频 URL");
        }
        console.log(`[DoubaoVideo] 视频生成完成: ${videoUrl.substring(0, 80)}...`);
        return videoUrl;
      }

      if (queryData.status === "failed") {
        const errMsg = queryData.error?.message || "未知错误";
        throw new Error(`豆包视频生成失败: ${errMsg}`);
      }
    }

    throw new Error("豆包视频生成超时（已等待 5 分钟）");
  }

  // 从 Seedance 响应中提取视频 URL，兼容多种返回结构
  private extractVideoUrl(content: unknown): string | null {
    if (!content) return null;

    // 情况 1: content 是数组 [{type: "video_url", video_url: {url: "..."}}]
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item?.video_url?.url) return item.video_url.url;
        if (item?.url) return item.url;
      }
    }

    // 情况 2: content 是对象 {video_url: {url: "..."}} 或 {video_url: "..."}
    if (typeof content === "object") {
      const obj = content as Record<string, unknown>;
      if (typeof obj.video_url === "string") return obj.video_url;
      if (typeof obj.video_url === "object" && obj.video_url) {
        const vu = obj.video_url as Record<string, unknown>;
        if (typeof vu.url === "string") return vu.url;
      }
      if (typeof obj.url === "string") return obj.url;
    }

    // 情况 3: content 本身就是 URL 字符串
    if (typeof content === "string" && content.startsWith("http")) return content;

    // 最后尝试: 在整个 JSON 中搜索 URL
    const json = JSON.stringify(content);
    const match = json.match(/https?:\/\/[^"\\]+\.mp4[^"\\]*/);
    if (match) return match[0];

    return null;
  }
}
