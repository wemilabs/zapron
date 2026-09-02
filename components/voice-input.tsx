"use client";

import { Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  size?: "default" | "sm" | "icon" | "icon-sm";
}

type State = "idle" | "recording" | "transcribing" | "error";

export function VoiceInput({
  onTranscript,
  disabled,
  size = "icon-sm",
}: VoiceInputProps) {
  const [state, setState] = useState<State>("idle");
  const [supported, setSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "MediaRecorder" in window &&
        navigator.mediaDevices != null,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => {
        t.stop();
      });
      streamRef.current = null;
    };
  }, []);

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => {
      t.stop();
    });
    streamRef.current = null;
  }

  async function handleStart() {
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => {
          t.stop();
        });
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          setState("idle");
          return;
        }

        setState("transcribing");
        try {
          const response = await fetch("/api/stt", {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          if (!response.ok) {
            const { error } = (await response.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(error ?? "Transcription failed.");
          }
          const { text } = (await response.json()) as { text: string };
          if (text.trim()) onTranscript(text.trim());
          setState("idle");
        } catch {
          setState("error");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch {
      setState("error");
    }
  }

  function handleStop() {
    stopRecording();
  }

  function handleClick() {
    if (state === "recording") {
      handleStop();
    } else if (state === "error") {
      setState("idle");
    } else if (state === "idle") {
      handleStart();
    }
  }

  if (!supported) return null;

  const label =
    state === "recording"
      ? "Stop recording"
      : state === "transcribing"
        ? "Transcribing…"
        : state === "error"
          ? "Retry voice input"
          : "Voice input";

  return (
    <Button
      type="button"
      variant={state === "recording" ? "destructive" : "ghost"}
      size={size}
      onClick={handleClick}
      disabled={disabled || state === "transcribing"}
      aria-label={label}
      title={label}
    >
      {state === "transcribing" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === "recording" ? (
        <MicOff className="size-3.5" />
      ) : (
        <Mic className="size-3.5" />
      )}
    </Button>
  );
}

function pickMimeType(): string | undefined {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) return;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
}
