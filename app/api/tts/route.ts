import { NextResponse } from "next/server";

import { generateSpeechAudio } from "@/lib/ai/speech";

export async function POST(request: Request) {
  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Missing 'text' field." },
      { status: 400 },
    );
  }

  try {
    const audio = await generateSpeechAudio(text);
    const bytes = audio.uint8Array;
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);

    return new Response(buffer, {
      headers: {
        "Content-Type": audio.mediaType ?? "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate speech.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
