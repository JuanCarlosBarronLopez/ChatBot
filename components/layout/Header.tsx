"use client";

import { FlaskConical, FolderGit2 } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c6cff] to-[#3b82f6] shadow-[0_8px_24px_-8px_rgba(124,108,255,0.8)]"
        >
          <FlaskConical className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-zinc-50">
            Gemini Chat Lab
          </p>
          <p className="text-[11px] text-zinc-500">Next.js · TypeScript · @google/genai</p>
        </div>
      </div>
      <nav className="flex items-center gap-2" aria-label="Enlaces">
        <a
          href="https://github.com/JuanCarlosBarronLopez/ChatBot"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          <FolderGit2 className="h-4 w-4" />
          <span className="hidden sm:inline">Repositorio</span>
        </a>
      </nav>
    </header>
  );
}
