"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendFeedback } from "@/lib/chat-api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** Présent une fois le message persisté côté backend — nécessaire pour le feedback. */
  serverId?: string;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState<"up" | "down" | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function rate(value: "up" | "down") {
    if (!message.serverId || rated) return;
    setRated(value);
    try {
      await sendFeedback(message.serverId, value);
    } catch {
      setRated(null);
    }
  }

  if (isUser) {
    return (
      <div className="flex animate-fade-in justify-end">
        <div
          className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-white sm:max-w-[70%]"
          style={{ background: "var(--primary)" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in flex-col items-start gap-1.5">
      <div className="max-w-[90%] rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-relaxed sm:max-w-[80%]">
        <div className="prose-toumai">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content || (message.streaming ? "" : "")}
          </ReactMarkdown>
        </div>
        {message.streaming && (
          <span className="streaming-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-current align-middle" />
        )}
      </div>
      {!message.streaming && message.content && (
        <div className="flex items-center gap-1 px-1 text-[var(--text-tertiary)]">
          <button
            onClick={copy}
            aria-label="Copier la réponse"
            className="rounded p-1.5 text-xs transition hover:bg-white/5 hover:text-[var(--text-primary)]"
          >
            {copied ? "Copié" : "Copier"}
          </button>
          {message.serverId && (
            <>
              <button
                onClick={() => rate("up")}
                aria-label="Bonne réponse"
                disabled={!!rated}
                className={`rounded p-1.5 text-xs transition hover:bg-white/5 ${
                  rated === "up" ? "text-[var(--success)]" : "hover:text-[var(--text-primary)]"
                }`}
              >
                👍
              </button>
              <button
                onClick={() => rate("down")}
                aria-label="Mauvaise réponse"
                disabled={!!rated}
                className={`rounded p-1.5 text-xs transition hover:bg-white/5 ${
                  rated === "down" ? "text-[var(--error)]" : "hover:text-[var(--text-primary)]"
                }`}
              >
                👎
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
