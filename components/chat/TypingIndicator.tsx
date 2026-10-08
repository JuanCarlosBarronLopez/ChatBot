"use client";

export function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-label="El modelo está escribiendo" role="status">
      <div
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"
      >
        <span className="typing-dots flex gap-1 text-zinc-300">
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </span>
      </div>
      <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3">
        <span className="typing-dots flex gap-1 text-lg leading-none text-zinc-400">
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </span>
        <span className="sr-only">Generando respuesta…</span>
      </div>
    </div>
  );
}
