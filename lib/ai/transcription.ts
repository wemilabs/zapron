import { createXai } from "@ai-sdk/xai";
import { transcribe } from "ai";

const xai = createXai({
  baseURL: process.env.XAI_API_BASE_URL,
  apiKey: process.env.XAI_API_KEY,
});

export async function transcribeAudio(audio: Uint8Array): Promise<string> {
  const result = await transcribe({
    model: xai.transcription(),
    audio,
  });

  return result.text;
}
