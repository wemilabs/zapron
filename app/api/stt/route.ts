import { NextResponse } from "next/server";

import { transcribeAudio } from "@/lib/ai/transcription";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (
    !contentType.includes("audio/") &&
    !contentType.includes("octet-stream")
  ) {
    return NextResponse.json(
      { error: "Expected an audio content type." },
      { status: 400 },
    );
  }

  try {
    const buffer = new Uint8Array(await request.arrayBuffer());
    const text = await transcribeAudio(buffer);
    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to transcribe audio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
