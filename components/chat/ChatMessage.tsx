"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { formatLatency, formatTime, cn } from "@/lib/utils/format";
import { MessageActions } from "@/components/chat/MessageActions";

export function ChatMessageView({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);
  const long = message.content.length > 1200;
  const shown = !long || expanded ? message.content : `${message.content.slice(0, 1200)}…`;

  return (
    <article
      aria-label={isUser ? "Tu mensaje" : "Respuesta del modelo"}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        aria-hidden
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
          isUser
            ? "border-[#7c6cff]/40 bg-[#7c6cff]/15 text-[#a5a0ff]"
            : "border-white/10 bg-white/[0.05] text-zinc-300",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("min-w-0 max-w-[85%] sm:max-w-[78%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-[14px] leading-relaxed",
            isUser
              ? "rounded-tr-md border-[#7c6cff]/30 bg-[#7c6cff]/[0.14] text-zinc-100"
              : "rounded-tl-md border-white/10 bg-white/[0.04] text-zinc-200",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{shown}</p>
          ) : (
            <div className="md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{shown}</ReactMarkdown>
            </div>
          )}
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-medium text-[#a5a0ff] underline underline-offset-4 hover:text-white"
            >
              {expanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          {!isUser && message.model && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">
              {message.model}
            </span>
          )}
          {!isUser && typeof message.latencyMs === "number" && (
            <span>{formatLatency(message.latencyMs)}</span>
          )}
          {!isUser && message.usage?.totalTokens !== undefined && (
            <span>
              {message.usage.inputTokens ?? "?"} in / {message.usage.outputTokens ?? "?"} out
              {" · "}
              {message.usage.totalTokens} tok
            </span>
          )}
          {!isUser && <MessageActions content={message.content} />}
        </div>
      </div>
    </article>
  );
}
