"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable (permissions, insecure context).
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Respuesta copiada" : "Copiar respuesta"}
      title="Copiar respuesta"
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="text-[11px]">{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
