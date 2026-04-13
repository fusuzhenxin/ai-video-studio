import { NextRequest, NextResponse } from "next/server";
import { getVideoProvider, VideoProvider } from "@/lib/providers";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, provider = "replicate" } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "请提供源图片URL (imageUrl)" },
        { status: 400 }
      );
    }

    // 检查是否为占位图 URL（不可被外部 API 访问）
    if (imageUrl.includes("placehold.co") || !imageUrl.startsWith("http")) {
      console.error(`[API /generate-video] 图片 URL 无效或为占位图: ${imageUrl.substring(0, 80)}`);
      return NextResponse.json(
        { error: "分镜预览图无效，请先在分镜步骤重新生成图片" },
        { status: 400 }
      );
    }

    console.log(`[API /generate-video] provider=${provider}, imageUrl=${imageUrl.substring(0, 80)}...`);

    const videoProvider = getVideoProvider(provider as VideoProvider);
    const videoUrl = await videoProvider.generateVideo(imageUrl);

    return NextResponse.json({ url: videoUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "视频生成失败";
    console.error("[API /generate-video] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
