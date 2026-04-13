export type InputMode = "image" | "text" | "novel";

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file?: File;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  appearance?: string;
  imagePrompt?: string;
  imageUrl: string;
  tags: string[];
}

export interface BackgroundAsset {
  id: string;
  name: string;
  description: string;
  imagePrompt?: string;
  imageUrl: string;
  tags: string[];
}

export interface StoryboardScene {
  id: string;
  order: number;
  sceneDescription: string;
  characterAction: string;
  cameraAngle: string;
  duration: number;
  dialogues: string;
  characterIds: string[];
  characterNames?: string[];
  backgroundId: string;
  backgroundName?: string;
  imagePrompt?: string;
  previewUrl: string;
  videoClipUrl?: string;
  status: "pending" | "generating" | "done" | "error";
}

export interface ProjectData {
  id: string;
  name: string;
  inputMode: InputMode;
  rawText: string;
  uploadedImages: UploadedImage[];
  characters: CharacterProfile[];
  backgrounds: BackgroundAsset[];
  storyboard: StoryboardScene[];
  finalVideoUrl?: string;
  status: "input" | "analyzing" | "storyboard" | "generating" | "compositing" | "done";
  createdAt: string;
}
