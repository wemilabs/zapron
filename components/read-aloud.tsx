"use client";

import { Loader2, Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface ReadAloudProps {
  text: string;
}

type Status = "idle" | "loading" | "playing" | "paused" | "error";

function cleanText(text: string): string {
  // The AI summary renders **bold** section names; strip the markers so the
  // TTS model doesn't read "asterisk asterisk".
  return text.replace(/\*\*(.+?)\*\*/g, "$1").trim();
}

export function ReadAloud({ text }: ReadAloudProps) {
  const [status, setStatus] = useState<Status>("idle");

  // Audio element and its blob URL live on refs. Not reactive, only the
  // playback status drives the UI.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  // Cache key: the cleaned text we already fetched audio for, so replay /
  // pause-resume doesn't re-hit the API.
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  async function fetchAudio(): Promise<HTMLAudioElement> {
    const cleaned = cleanText(text);
    if (fetchedForRef.current === cleaned && audioRef.current) {
      return audioRef.current;
    }

    // Clean up any previous audio before creating a new one.
    if (audioRef.current) audioRef.current.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
    });

    if (!response.ok) {
      const { error } = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(error ?? "Failed to generate speech.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => setStatus("idle");
    audio.onerror = () => setStatus("error");

    urlRef.current = url;
    audioRef.current = audio;
    fetchedForRef.current = cleaned;
    return audio;
  }

  async function handlePlay() {
    if (status === "paused" && audioRef.current) {
      audioRef.current.play();
      setStatus("playing");
      return;
    }

    setStatus("loading");
    try {
      const audio = await fetchAudio();
      audio.currentTime = 0;
      await audio.play();
      setStatus("playing");
    } catch (error) {
      setStatus("error");
      console.error(error);
    }
  }

  function handlePause() {
    if (audioRef.current) {
      audioRef.current.pause();
      setStatus("paused");
    }
  }

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus("idle");
  }

  return (
    <div className="flex items-center gap-1">
      {(status === "idle" || status === "error") && (
        <Button type="button" size="sm" variant="ghost" onClick={handlePlay}>
          <Play className="size-3.5" />
          {status === "error" ? "Retry" : "Read aloud"}
        </Button>
      )}
      {status === "loading" && (
        <Button type="button" size="sm" variant="ghost" disabled>
          <Loader2 className="size-3.5 animate-spin" />
          Generating…
        </Button>
      )}
      {status === "playing" && (
        <Button type="button" size="sm" variant="ghost" onClick={handlePause}>
          <Pause className="size-3.5" />
          Pause
        </Button>
      )}
      {status === "paused" && (
        <Button type="button" size="sm" variant="ghost" onClick={handlePlay}>
          <Play className="size-3.5" />
          Resume
        </Button>
      )}
      {(status === "playing" || status === "paused") && (
        <Button type="button" size="sm" variant="ghost" onClick={handleStop}>
          <Square className="size-3.5" />
          Stop
        </Button>
      )}
    </div>
  );
}
