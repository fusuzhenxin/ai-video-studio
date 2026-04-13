import { NextRequest, NextResponse } from "next/server";
import { compositeVideoClips, CompositeRequest } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompositeRequest;

    if (!body.clips || !Array.isArray(body.clips) || body.clips.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一个视频片段" },
        { status: 400 }
      );
    }

    const result = await compositeVideoClips(body);

    return NextResponse.json({ result: JSON.parse(result) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "视频合成失败";
    console.error("[API /composite] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
