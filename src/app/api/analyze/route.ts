import { NextRequest, NextResponse } from "next/server";
import { getTextProvider, TextProvider } from "@/lib/providers";

export async function POST(req: NextRequest) {
  try {
    const { text, provider = "openai" } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        { error: "请提供至少10个字符的文本内容" },
        { status: 400 }
      );
    }

    console.log(`[API /analyze] 开始调用 provider=${provider}, 文本长度=${text.trim().length}`);
    const startTime = Date.now();

    const textProvider = getTextProvider(provider as TextProvider);
    const result = await textProvider.analyze(text.trim());

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[API /analyze] ✓ 完成! 用时 ${elapsed}s, 角色=${result.characters?.length}, 场景=${result.backgrounds?.length}, 分镜=${result.scenes?.length}`);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "分析失败";
    console.error("[API /analyze] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
