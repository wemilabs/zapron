"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-4" />
      Back to search
    </button>
  );
}
