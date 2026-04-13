import OpenAI from "openai";
import { ITextProvider, IImageProvider, IVideoProvider, AnalysisResult } from "./types";
import { ANALYSIS_SYSTEM_PROMPT } from "./prompts";

// ============ 通义千问 Text Provider ============

export class QianwenTextProvider implements ITextProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error("DASHSCOPE_API_KEY 未配置");
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
    this.model = process.env.QIANWEN_MODEL || "qwen-turbo";
  }

  async analyze(text: string): Promise<AnalysisResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("通义千问返回空响应");

    // 清理可能的 markdown 代码块包裹
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(jsonStr) as AnalysisResult;
    } catch {
      console.error("[Qianwen] JSON 解析失败，原始响应:", content.substring(0, 500));
      throw new Error("通义千问返回内容不是有效 JSON");
    }

    if (!parsed.characters?.length) {
      console.error("[Qianwen] 响应缺少 characters:", JSON.stringify(parsed).substring(0, 300));
      throw new Error("未提取到角色");
    }
    if (!parsed.backgrounds?.length) throw new Error("未提取到场景");
    if (!parsed.scenes?.length) throw new Error("未提取到分镜");
    return parsed;
  }
}

// ============ 通义万相 Image Provider (DashScope Native Async API) ============

interface WanxImageTaskResponse {
  output: { task_id: string; task_status: string };
  request_id: string;
}

interface WanxImageResultResponse {
  output: {
    task_id: string;
    task_status: "SUCCEEDED" | "FAILED" | "PENDING" | "RUNNING";
    results?: Array<{ url: string }>;
    message?: string;
    code?: string;
  };
  request_id: string;
}

export class WanxiangImageProvider implements IImageProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error("DASHSCOPE_API_KEY 未配置");
    this.apiKey = apiKey;
    this.model = process.env.WANXIANG_IMAGE_MODEL || "wanx2.1-t2i-turbo";
  }

  // wanx2.1-t2i-turbo 支持的尺寸: 1024*1024, 1280*720, 720*1280 等
  private static SIZE_MAP: Record<string, string> = {
    "1024x1024": "1024*1024",
    "1792x1024": "1280*720",   // 横屏映射
    "1024x1792": "720*1280",   // 竖屏映射
    "512x512":   "1024*1024",
  };

  async generateImage(prompt: string, size: string = "1024x1024"): Promise<string> {
    const wanxSize = WanxiangImageProvider.SIZE_MAP[size] || "1024*1024";
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[WanxiangImage] 提交任务 (attempt ${attempt}), model=${this.model}: "${prompt.substring(0, 50)}..."`);

        // Step 1: 提交异步任务
        const submitRes = await fetch(
          "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
              "X-DashScope-Async": "enable",
            },
            body: JSON.stringify({
              model: this.model,
              input: { prompt },
              parameters: { size: wanxSize, n: 1 },
            }),
          }
        );

        if (!submitRes.ok) {
          const errText = await submitRes.text();
          // 限流重试
          if (errText.includes("Throttling") || errText.includes("rate")) {
            const wait = attempt * 5;
            console.warn(`[WanxiangImage] 限流，等待 ${wait}s 后重试 (${attempt}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, wait * 1000));
            continue;
          }
          throw new Error(`通义万相提交失败: ${errText}`);
        }

        const submitData = (await submitRes.json()) as WanxImageTaskResponse;
        const taskId = submitData.output?.task_id;
        if (!taskId) throw new Error("通义万相未返回 task_id");
        console.log(`[WanxiangImage] 任务已提交: ${taskId}`);

        // Step 2: 轮询结果 (最长 120s)
        const maxWait = 120_000;
        const pollInterval = 3_000;
        const start = Date.now();

        while (Date.now() - start < maxWait) {
          await new Promise((r) => setTimeout(r, pollInterval));

          const resultRes = await fetch(
            `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
            { headers: { "Authorization": `Bearer ${this.apiKey}` } }
          );
          if (!resultRes.ok) continue;

          const resultData = (await resultRes.json()) as WanxImageResultResponse;
          const status = resultData.output?.task_status;

          if (status === "SUCCEEDED") {
            const url = resultData.output?.results?.[0]?.url;
            if (!url) throw new Error("通义万相未返回图片 URL");
            console.log(`[WanxiangImage] ✓ 图片生成成功 (${Math.round((Date.now() - start) / 1000)}s)`);
            return url;
          }
          if (status === "FAILED") {
            const failMsg = resultData.output?.message || resultData.output?.code || "未知原因";
            console.error(`[WanxiangImage] 任务失败: ${failMsg}, size=${wanxSize}`);
            throw new Error(`通义万相图片生成失败: ${failMsg}`);
          }
        }
        throw new Error("通义万相图片生成超时");

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if ((msg.includes("Throttling") || msg.includes("rate")) && attempt < maxRetries) {
          const wait = attempt * 5;
          console.warn(`[WanxiangImage] 限流，等待 ${wait}s 后重试 (${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait * 1000));
          continue;
        }
        console.error(`[WanxiangImage] 错误:`, msg);
        throw err;
      }
    }
    throw new Error("通义万相图片生成失败: 多次重试仍然失败");
  }
}

// ============ 通义万相 Video Provider (DashScope API) ============

interface WanxiangTaskResponse {
  output: {
    task_id: string;
    task_status: string;
  };
  request_id: string;
}

interface WanxVideoResultResponse {
  output: {
    task_id: string;
    task_status: "SUCCEEDED" | "FAILED" | "PENDING" | "RUNNING";
    video_url?: string;
    results?: Array<{ url: string }>;
  };
  request_id: string;
}

export class WanxiangVideoProvider implements IVideoProvider {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error("DASHSCOPE_API_KEY 未配置");
    this.apiKey = apiKey;
  }

  async generateVideo(imageUrl: string): Promise<string> {
    console.log(`[WanxiangVideo] 提交图生视频, imageUrl=${imageUrl.substring(0, 100)}...`);

    const maxRetries = 3;
    let submitData: WanxiangTaskResponse | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",
          },
          body: JSON.stringify({
            model: "wanx-v1",
            input: { image_url: imageUrl },
            parameters: { duration: 4 },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        if ((errText.includes("Throttling") || errText.includes("rate")) && attempt < maxRetries) {
          const wait = attempt * 10;
          console.warn(`[WanxiangVideo] 限流，等待 ${wait}s 后重试 (${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait * 1000));
          continue;
        }
        console.error(`[WanxiangVideo] 提交失败: ${errText}`);
        throw new Error(`通义万相视频提交失败: ${errText}`);
      }

      submitData = (await res.json()) as WanxiangTaskResponse;
      break;
    }

    if (!submitData) throw new Error("通义万相视频提交失败: 多次重试后仍失败");
    const taskId = submitData.output?.task_id;
    if (!taskId) throw new Error("通义万相视频未返回 task_id");
    console.log(`[WanxiangVideo] 任务已提交: ${taskId}`);

    // Poll for result (max 300s for video)
    const maxWait = 300_000;
    const pollInterval = 5_000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, pollInterval));

      const resultRes = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        { headers: { "Authorization": `Bearer ${this.apiKey}` } }
      );

      if (!resultRes.ok) continue;

      const resultData = (await resultRes.json()) as WanxVideoResultResponse;
      const status = resultData.output?.task_status;
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`[WanxiangVideo] 任务 ${taskId} 状态: ${status} (${elapsed}s)`);

      if (status === "SUCCEEDED") {
        const url = resultData.output?.video_url || resultData.output?.results?.[0]?.url;
        if (!url) throw new Error("通义万相视频未返回 URL");
        console.log(`[WanxiangVideo] ✓ 视频生成成功`);
        return url;
      }

      if (status === "FAILED") {
        throw new Error("通义万相视频生成失败");
      }
    }

    throw new Error("通义万相视频生成超时");
  }
}
