import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectProvider } from "@/context/ProjectContext";
import { ProviderProvider } from "@/context/ProviderContext";

export const metadata: Metadata = {
  title: "AI视界 - 智能视频生成平台",
  description: "通过文本、图片或小说剧情，AI自动生成专业视频作品",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <ProviderProvider>
          <ProjectProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
          </ProjectProvider>
        </ProviderProvider>
      </body>
    </html>
  );
}
