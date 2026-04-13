import {
  TextProvider,
  ImageProvider,
  VideoProvider,
  ITextProvider,
  IImageProvider,
  IVideoProvider,
} from "./types";
import { OpenAITextProvider, DallE3ImageProvider, ReplicateVideoProvider } from "./openai-provider";
import { QianwenTextProvider, WanxiangImageProvider, WanxiangVideoProvider } from "./qianwen-provider";
import { DoubaoTextProvider, JimengImageProvider, DoubaoImageProvider, DoubaoVideoProvider } from "./doubao-provider";

// ============ Provider Factory ============

export function getTextProvider(provider: TextProvider): ITextProvider {
  switch (provider) {
    case "openai":
      return new OpenAITextProvider();
    case "qianwen":
      return new QianwenTextProvider();
    case "doubao":
      return new DoubaoTextProvider();
    default:
      throw new Error(`未知的文本模型提供商: ${provider}`);
  }
}

export function getImageProvider(provider: ImageProvider): IImageProvider {
  switch (provider) {
    case "dalle3":
      return new DallE3ImageProvider();
    case "wanxiang":
      return new WanxiangImageProvider();
    case "jimeng":
      return new JimengImageProvider();
    case "doubao_image":
      return new DoubaoImageProvider();
    default:
      throw new Error(`未知的图片模型提供商: ${provider}`);
  }
}

export function getVideoProvider(provider: VideoProvider): IVideoProvider {
  switch (provider) {
    case "replicate":
      return new ReplicateVideoProvider();
    case "wanxiang_video":
      return new WanxiangVideoProvider();
    case "doubao_video":
      return new DoubaoVideoProvider();
    default:
      throw new Error(`未知的视频模型提供商: ${provider}`);
  }
}

// Re-export types
export * from "./types";
