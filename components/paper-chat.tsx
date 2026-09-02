"use client";

import { readStreamableValue, type StreamableValue } from "@ai-sdk/rsc";
import {
  ExternalLink,
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { askAboutWork } from "@/app/work/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatMessage, SummaryInput } from "@/lib/ai/types";
import { VoiceInput } from "./voice-input";

interface PaperChatProps {
  input: SummaryInput;
  pdfUrl?: string | null;
}

type SendState = "idle" | "sending" | "error";

export function PaperChat({ input, pdfUrl }: PaperChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");

  const activeQRef = useRef(0);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || sendState === "sending") return;

    const userMsg: ChatMessage = { role: "user", content: question };
    const history = [...messages, userMsg];
    setMessages(history);
    setDraft("");
    setSendState("sending");

    const myQ = activeQRef.current + 1;
    activeQRef.current = myQ;

    const result = await askAboutWork(input, history);
    if (activeQRef.current !== myQ) return;

    if (!result.ok) {
      setSendState("error");
      return;
    }

    // Append an empty assistant message and stream into it.
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let accumulated = "";
    for await (const delta of readStreamableValue(
      result.stream as StreamableValue<string>,
    )) {
      if (activeQRef.current !== myQ) return;
      accumulated += delta ?? "";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: accumulated };
        return next;
      });
    }

    if (activeQRef.current !== myQ) return;
    setSendState("idle");
  }

  function handleClear() {
    activeQRef.current += 1;
    setMessages([]);
    setSendState("idle");
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={
          <Button
            type="button"
            size="icon"
            className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
            aria-label="Ask about this paper"
          />
        }
      >
        <MessageCircle className="size-5" />
      </DrawerTrigger>
      <DrawerContent className="flex flex-col">
        <DrawerHeader className="flex-row items-center justify-between">
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Ask about this paper
          </DrawerTitle>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Ask a question about the paper's methods, results, or findings.
              </p>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                >
                  <FileText className="size-3.5" />
                  Read full text <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ) : (
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="flex-1">
                <MessageScrollerViewport>
                  <MessageScrollerContent>
                    {messages.map((msg, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only, index is stable
                      <MessageScrollerItem key={i}>
                        <ChatBubble message={msg} />
                      </MessageScrollerItem>
                    ))}
                    {sendState === "sending" && (
                      <MessageScrollerItem>
                        <span className="animate-pulse text-sm text-muted-foreground">
                          ▋
                        </span>
                      </MessageScrollerItem>
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          )}

          {sendState === "error" && (
            <p className="text-sm text-destructive">
              Something went wrong. Try asking again.
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              disabled={sendState === "sending"}
              autoFocus
            />
            <VoiceInput
              onTranscript={(text) => setDraft(text)}
              disabled={sendState === "sending"}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || sendState === "sending"}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        {message.content}
      </div>
    );
  }
  return (
    <div className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
      {message.content}
    </div>
  );
}
