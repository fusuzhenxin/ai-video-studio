import OpenAI from "openai";
import Replicate from "replicate";

// ============ Client Initialization ============

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

function getReplicateClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  return new Replicate({ auth: token });
}

// ============ Types ============

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

// ============ 1. Content Analysis via LLM ============

const ANALYSIS_SYSTEM_PROMPT = `你是一个专业的影视分镜师和编剧。用户将给你一段文本（可能是场景描述、小说片段或剧情概要），你需要完成以下分析：

1. **角色提取**：识别文本中的所有角色，为每个角色提供：
   - name: 角色名称
   - description: 性格和背景简述
   - appearance: 外貌特征详细描述（用于AI生图）
   - imagePrompt: 英文的AI生图提示词，描述该角色的半身肖像照，风格为电影质感写实风格
   - tags: 标签数组

2. **场景/背景提取**：识别文本中涉及的所有场景/地点，为每个场景提供：
   - name: 场景名称
   - description: 场景氛围描述
   - imagePrompt: 英文的AI生图提示词，描述该场景的宽幅背景画面，风格为电影质感写实风格
   - tags: 标签数组

3. **分镜脚本拆分**：将文本拆分为多个连贯的分镜，每个分镜包含：
   - order: 分镜序号（从1开始）
   - sceneDescription: 该分镜的场景描述（中文）
   - characterAction: 角色在该分镜中的动作描述
   - cameraAngle: 推荐的镜头角度（如：正面中景、侧面特写、俯拍全景等）
   - duration: 建议时长（秒，3-10秒之间）
   - dialogues: 该分镜中的对白/旁白（无则留空）
   - characterNames: 出现在该分镜中的角色名称数组
   - backgroundName: 该分镜使用的场景名称
   - imagePrompt: 英文的AI生图提示词，描述该分镜的完整画面构图，包含角色、动作、场景、光影、镜头角度，风格为电影质感写实风格

请确保：
- 分镜之间逻辑连贯，有起承转合
- 每个imagePrompt都是高质量的英文提示词，适合DALL-E 3生成
- 如果文本较短，至少生成3个分镜；如果文本较长，最多生成12个分镜
- 角色至少1个，场景至少2个

以纯JSON格式返回，不要包含markdown代码块标记，结构如下：
{
  "characters": [...],
  "backgrounds": [...],
  "scenes": [...]
}`;

export async function analyzeContentWithLLM(text: string): Promise<AnalysisResult> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("LLM returned empty response");

  const parsed = JSON.parse(content) as AnalysisResult;

  // Validate basic structure
  if (!parsed.characters?.length) throw new Error("No characters extracted");
  if (!parsed.backgrounds?.length) throw new Error("No backgrounds extracted");
  if (!parsed.scenes?.length) throw new Error("No scenes extracted");

  return parsed;
}

// ============ 2. Image Generation via DALL-E ============

export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024"
): Promise<string> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

  const response = await client.images.generate({
    model,
    prompt,
    n: 1,
    size,
    quality: "standard",
    response_format: "url",
  });

  const url = response.data?.[0]?.url;
  if (!url) throw new Error("Image generation returned no URL");
  return url;
}

export async function generateCharacterImage(character: AnalyzedCharacter): Promise<string> {
  const prompt = character.imagePrompt ||
    `Cinematic portrait photo of ${character.appearance}, film quality, soft lighting, shallow depth of field, 8k`;
  return generateImage(prompt, "1024x1024");
}

export async function generateBackgroundImage(background: AnalyzedBackground): Promise<string> {
  const prompt = background.imagePrompt ||
    `Cinematic wide-angle landscape of ${background.description}, film quality, dramatic lighting, 8k`;
  return generateImage(prompt, "1792x1024");
}

export async function generateSceneImage(scene: AnalyzedScene): Promise<string> {
  const prompt = scene.imagePrompt ||
    `Cinematic film still: ${scene.sceneDescription}, ${scene.cameraAngle}, dramatic lighting, 8k quality`;
  return generateImage(prompt, "1792x1024");
}

// ============ 3. Video Generation via Replicate (Stable Video Diffusion) ============

export async function generateVideoFromImage(imageUrl: string): Promise<string> {
  const replicate = getReplicateClient();
  const model = process.env.REPLICATE_VIDEO_MODEL ||
    "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";

  const [owner_model, version] = model.split(":") as [string, string];

  const output = await replicate.run(`${owner_model}:${version}` as `${string}/${string}:${string}`, {
    input: {
      input_image: imageUrl,
      frames_per_second: 6,
      motion_bucket_id: 127,
      cond_aug: 0.02,
      decoding_t: 7,
      seed: 0,
    },
  });

  // Replicate returns the video URL directly or as array
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) return (first as { url: string }).url;
  }
  if (output && typeof output === "object" && "url" in output) {
    return (output as { url: string }).url;
  }

  throw new Error("Video generation returned unexpected format: " + JSON.stringify(output));
}

// ============ 4. Video Composition ============
// For true composition, we would need server-side ffmpeg.
// Here we provide the clip URLs and let the client handle concatenation
// or use a cloud-based approach.

export interface CompositeRequest {
  clips: { url: string; duration: number }[];
}

export async function compositeVideoClips(req: CompositeRequest): Promise<string> {
  // In production, this would use ffmpeg or a cloud video editing API
  // to merge all clips into one final video.
  // For now, return the first clip as a representative or a placeholder
  // indicating that real composition needs ffmpeg setup.
  if (req.clips.length === 0) throw new Error("No clips to composite");

  // Return all clip URLs packaged as a "playlist" that the frontend can play sequentially
  // Real implementation would merge them server-side
  return JSON.stringify({
    type: "playlist",
    clips: req.clips,
    message: "视频片段已生成，完整合成需要服务端 ffmpeg 支持",
  });
}
