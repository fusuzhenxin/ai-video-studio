"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ProjectData,
  InputMode,
  UploadedImage,
  CharacterProfile,
  BackgroundAsset,
  StoryboardScene,
} from "@/types";

interface ProjectContextType {
  project: ProjectData;
  setProjectName: (name: string) => void;
  setInputMode: (mode: InputMode) => void;
  setRawText: (text: string) => void;
  addImages: (images: UploadedImage[]) => void;
  removeImage: (id: string) => void;
  setCharacters: (chars: CharacterProfile[]) => void;
  setBackgrounds: (bgs: BackgroundAsset[]) => void;
  setStoryboard: (scenes: StoryboardScene[]) => void;
  updateScene: (id: string, updates: Partial<StoryboardScene>) => void;
  removeScene: (id: string) => void;
  reorderScenes: (scenes: StoryboardScene[]) => void;
  setStatus: (status: ProjectData["status"]) => void;
  setFinalVideoUrl: (url: string) => void;
  resetProject: () => void;
}

function createEmptyProject(): ProjectData {
  return {
    id: uuidv4(),
    name: "未命名项目",
    inputMode: "text",
    rawText: "",
    uploadedImages: [],
    characters: [],
    backgrounds: [],
    storyboard: [],
    status: "input",
    createdAt: new Date().toISOString(),
  };
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<ProjectData>(createEmptyProject());

  const setProjectName = useCallback((name: string) => {
    setProject((p) => ({ ...p, name }));
  }, []);

  const setInputMode = useCallback((mode: InputMode) => {
    setProject((p) => ({ ...p, inputMode: mode }));
  }, []);

  const setRawText = useCallback((text: string) => {
    setProject((p) => ({ ...p, rawText: text }));
  }, []);

  const addImages = useCallback((images: UploadedImage[]) => {
    setProject((p) => ({
      ...p,
      uploadedImages: [...p.uploadedImages, ...images],
    }));
  }, []);

  const removeImage = useCallback((id: string) => {
    setProject((p) => ({
      ...p,
      uploadedImages: p.uploadedImages.filter((img) => img.id !== id),
    }));
  }, []);

  const setCharacters = useCallback((chars: CharacterProfile[]) => {
    setProject((p) => ({ ...p, characters: chars }));
  }, []);

  const setBackgrounds = useCallback((bgs: BackgroundAsset[]) => {
    setProject((p) => ({ ...p, backgrounds: bgs }));
  }, []);

  const setStoryboard = useCallback((scenes: StoryboardScene[]) => {
    setProject((p) => ({ ...p, storyboard: scenes }));
  }, []);

  const updateScene = useCallback(
    (id: string, updates: Partial<StoryboardScene>) => {
      setProject((p) => ({
        ...p,
        storyboard: p.storyboard.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    },
    []
  );

  const removeScene = useCallback((id: string) => {
    setProject((p) => ({
      ...p,
      storyboard: p.storyboard
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i + 1 })),
    }));
  }, []);

  const reorderScenes = useCallback((scenes: StoryboardScene[]) => {
    setProject((p) => ({
      ...p,
      storyboard: scenes.map((s, i) => ({ ...s, order: i + 1 })),
    }));
  }, []);

  const setStatus = useCallback((status: ProjectData["status"]) => {
    setProject((p) => ({ ...p, status }));
  }, []);

  const setFinalVideoUrl = useCallback((url: string) => {
    setProject((p) => ({ ...p, finalVideoUrl: url }));
  }, []);

  const resetProject = useCallback(() => {
    setProject(createEmptyProject());
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProjectName,
        setInputMode,
        setRawText,
        addImages,
        removeImage,
        setCharacters,
        setBackgrounds,
        setStoryboard,
        updateScene,
        removeScene,
        reorderScenes,
        setStatus,
        setFinalVideoUrl,
        resetProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
