// ============ Provider Type Definitions ============

export type TextProvider = "openai" | "qianwen" | "doubao";
export type ImageProvider = "dalle3" | "wanxiang" | "jimeng" | "doubao_image";
export type VideoProvider = "replicate" | "wanxiang_video" | "doubao_video";

export interface ProviderConfig {
  text: TextProvider;
  image: ImageProvider;
  video: VideoProvider;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  models: {
    text?: string;
    image?: string;
    video?: string;
  };
}

// Provider metadata for UI display
export const TEXT_PROVIDERS: Record<TextProvider, ProviderInfo> = {
  openai: {
    id: "openai",
    name: "OpenAI GPT",
    description: "GPT-4o / GPT-4 系列，英文能力强",
    icon: "🤖",
    models: { text: "gpt-4o" },
  },
  qianwen: {
    id: "qianwen",
    name: "通义千问",
    description: "阿里云 Qwen 系列，中文理解优秀",
    icon: "🔮",
    models: { text: "qwen-max" },
  },
  doubao: {
    id: "doubao",
    name: "豆包",
    description: "字节跳动豆包大模型，性价比高",
    icon: "🫘",
    models: { text: "doubao-pro-256k" },
  },
};

export const IMAGE_PROVIDERS: Record<ImageProvider, ProviderInfo> = {
  dalle3: {
    id: "dalle3",
    name: "DALL·E 3",
    description: "OpenAI 旗舰图片生成，画面精美",
    icon: "🎨",
    models: { image: "dall-e-3" },
  },
  wanxiang: {
    id: "wanxiang",
    name: "通义万相",
    description: "阿里云 wanx2.1，中文提示词友好",
    icon: "🖼️",
    models: { image: "wanx2.1-t2i-turbo" },
  },
  jimeng: {
    id: "jimeng",
    name: "即梦 AI",
    description: "字节跳动即梦，风格多样化",
    icon: "✨",
    models: { image: "jimeng-2.1" },
  },
  doubao_image: {
    id: "doubao_image",
    name: "豆包 Seedream",
    description: "字节跳动豆包文生图，画质精细",
    icon: "🫘",
    models: { image: "doubao-seedream-4-5" },
  },
};

export const VIDEO_PROVIDERS: Record<VideoProvider, ProviderInfo> = {
  replicate: {
    id: "replicate",
    name: "Stable Video Diffusion",
    description: "Replicate 托管，图片转视频",
    icon: "🎬",
    models: { video: "stable-video-diffusion" },
  },
  wanxiang_video: {
    id: "wanxiang_video",
    name: "通义万相·视频",
    description: "阿里云视频生成，画面连贯",
    icon: "📹",
    models: { video: "wanx-v1" },
  },
  doubao_video: {
    id: "doubao_video",
    name: "豆包 Seedance",
    description: "字节跳动图生视频，动态自然流畅",
    icon: "🎥",
    models: { video: "doubao-seedance-1-5-pro" },
  },
};

// Analysis result types (shared across providers)
export interface AnalyzedCharacter {
  name: string;
  description: string;
  appearance: string;
  imagePrompt: string;
  tags: string[];
}

export interface AnalyzedBackground {
  name: string;
  description: string;
  imagePrompt: string;
  tags: string[];
}

export interface AnalyzedScene {
  order: number;
  sceneDescription: string;
  characterAction: string;
  cameraAngle: string;
  duration: number;
  dialogues: string;
  characterNames: string[];
  backgroundName: string;
  imagePrompt: string;
}

export interface AnalysisResult {
  characters: AnalyzedCharacter[];
  backgrounds: AnalyzedBackground[];
  scenes: AnalyzedScene[];
}

// Provider interface - each provider must implement these
export interface ITextProvider {
  analyze(text: string): Promise<AnalysisResult>;
}

export interface IImageProvider {
  generateImage(prompt: string, size?: string): Promise<string>;
}

export interface IVideoProvider {
  generateVideo(imageUrl: string): Promise<string>;
}
