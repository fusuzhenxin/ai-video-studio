import { NextRequest, NextResponse } from "next/server";
import { getImageProvider, ImageProvider } from "@/lib/providers";

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, provider = "dalle3" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "请提供图片生成提示词 (prompt)" },
        { status: 400 }
      );
    }

    const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
    const imageSize = validSizes.includes(size) ? size : "1024x1024";

    const imageProvider = getImageProvider(provider as ImageProvider);
    const url = await imageProvider.generateImage(prompt, imageSize);

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "图片生成失败";
    console.error("[API /generate-image] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
