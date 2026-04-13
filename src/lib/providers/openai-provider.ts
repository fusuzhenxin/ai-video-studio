import OpenAI from "openai";
import Replicate from "replicate";
import { ITextProvider, IImageProvider, IVideoProvider, AnalysisResult } from "./types";
import { ANALYSIS_SYSTEM_PROMPT } from "./prompts";

// ============ OpenAI Text Provider (GPT-4) ============

export class OpenAITextProvider implements ITextProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY 未配置");
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
    this.model = process.env.OPENAI_MODEL || "gpt-4o";
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
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI 返回空响应");
    const parsed = JSON.parse(content) as AnalysisResult;
    if (!parsed.characters?.length) throw new Error("未提取到角色");
    if (!parsed.backgrounds?.length) throw new Error("未提取到场景");
    if (!parsed.scenes?.length) throw new Error("未提取到分镜");
    return parsed;
  }
}

// ============ DALL-E 3 Image Provider ============

export class DallE3ImageProvider implements IImageProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY 未配置");
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
    this.model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
  }

  async generateImage(prompt: string, size: string = "1024x1024"): Promise<string> {
    const validSizes = ["1024x1024", "1792x1024", "1024x1792"] as const;
    const imageSize = validSizes.includes(size as typeof validSizes[number])
      ? (size as typeof validSizes[number])
      : "1024x1024";

    const response = await this.client.images.generate({
      model: this.model,
      prompt,
      n: 1,
      size: imageSize,
      quality: "standard",
      response_format: "url",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("DALL-E 未返回图片 URL");
    return url;
  }
}

// ============ Replicate Video Provider (Stable Video Diffusion) ============

export class ReplicateVideoProvider implements IVideoProvider {
  private replicate: Replicate;
  private model: string;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN 未配置");
    this.replicate = new Replicate({ auth: token });
    this.model = process.env.REPLICATE_VIDEO_MODEL ||
      "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";
  }

  async generateVideo(imageUrl: string): Promise<string> {
    const [ownerModel, version] = this.model.split(":") as [string, string];

    const output = await this.replicate.run(`${ownerModel}:${version}` as `${string}/${string}:${string}`, {
      input: {
        input_image: imageUrl,
        frames_per_second: 6,
        motion_bucket_id: 127,
        cond_aug: 0.02,
        decoding_t: 7,
        seed: 0,
      },
    });

    if (typeof output === "string") return output;
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && "url" in first) return (first as { url: string }).url;
    }
    if (output && typeof output === "object" && "url" in output) {
      return (output as { url: string }).url;
    }
    throw new Error("Replicate 返回格式异常: " + JSON.stringify(output));
  }
}
