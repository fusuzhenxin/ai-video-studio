"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  TextProvider,
  ImageProvider,
  VideoProvider,
  ProviderConfig,
} from "@/lib/providers/types";

interface ProviderContextType {
  config: ProviderConfig;
  setTextProvider: (p: TextProvider) => void;
  setImageProvider: (p: ImageProvider) => void;
  setVideoProvider: (p: VideoProvider) => void;
}

const defaultConfig: ProviderConfig = {
  text: "openai",
  image: "dalle3",
  video: "replicate",
};

const ProviderContext = createContext<ProviderContextType | null>(null);

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ProviderConfig>(defaultConfig);

  const setTextProvider = useCallback((p: TextProvider) => {
    setConfig((c) => ({ ...c, text: p }));
  }, []);

  const setImageProvider = useCallback((p: ImageProvider) => {
    setConfig((c) => ({ ...c, image: p }));
  }, []);

  const setVideoProvider = useCallback((p: VideoProvider) => {
    setConfig((c) => ({ ...c, video: p }));
  }, []);

  return (
    <ProviderContext.Provider
      value={{ config, setTextProvider, setImageProvider, setVideoProvider }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviders() {
  const ctx = useContext(ProviderContext);
  if (!ctx) throw new Error("useProviders must be used within ProviderProvider");
  return ctx;
}
