"use client";

import { MessagesSquare } from "lucide-react";

const SUGGESTIONS = [
  "Explícame qué es la temperatura en un LLM con un ejemplo",
  "Dame una receta corta con exactitud de 50 tokens",
  "Responde como un pirata: ¿por qué el cielo es azul?",
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <MessagesSquare className="h-6 w-6 text-[#a5a0ff]" />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-zinc-100">
        Empieza una conversación
      </h2>
      <p className="mt-1 max-w-md text-[13px] leading-relaxed text-zinc-500">
        Envía un mensaje y ajusta el modelo, la System Instruction y los parámetros de muestreo en
        el panel lateral. Prueba los casos académicos desde el Experiment Lab.
      </p>
      <div className="mt-5 flex w-full max-w-xl flex-col gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left text-[13px] text-zinc-300 transition-colors hover:border-[#7c6cff]/40 hover:bg-[#7c6cff]/[0.08]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
