"use client";

import { useRef, useState } from "react";
import { SendHorizontal, Square } from "lucide-react";

interface Props {
  disabled?: boolean;
  isLoading?: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}

export function ChatInput({ disabled, isLoading, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function submit(): void {
    const text = value.trim();
    if (!text || disabled || isLoading) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(() => ref.current?.focus());
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-2 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)]">
      <label htmlFor="chat-input" className="sr-only">
        Escribe tu mensaje. Enter para enviar, Shift más Enter para salto de línea.
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Pregunta lo que sea… (Enter ↵ envía · Shift+Enter salto de línea)"
        className="max-h-40 w-full resize-y bg-transparent px-3 pt-2 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between px-1.5 pb-1">
        <p className="hidden text-[11px] text-zinc-600 sm:block">
          Markdown y código soportados · El historial se envía al servidor validado
        </p>
        <div className="ml-auto flex items-center gap-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Detener generación"
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
            >
              <Square className="h-4 w-4" />
              Detener
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={disabled || value.trim().length === 0}
              aria-label="Enviar mensaje"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c6cff] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(124,108,255,0.7)] transition-colors hover:bg-[#6a5af0] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <SendHorizontal className="h-4 w-4" />
              Enviar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
