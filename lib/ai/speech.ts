import { createXai } from "@ai-sdk/xai";
import { generateSpeech } from "ai";

const xai = createXai({
  baseURL: process.env.XAI_API_BASE_URL,
  apiKey: process.env.XAI_API_KEY,
});

export async function generateSpeechAudio(text: string) {
  const result = await generateSpeech({
    model: xai.speech(),
    text,
    voice: "eve",
    language: "auto",
    outputFormat: "mp3",
  });

  return result.audio;
}
