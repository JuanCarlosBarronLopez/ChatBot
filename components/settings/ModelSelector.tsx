"use client";

import { MODEL_REGISTRY, type ModelKey } from "@/lib/ai/models";
import { FieldLabel, HelpText } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/format";

interface Props {
  value: string;
  onChange: (key: ModelKey) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: Props) {
  return (
    <div>
      <FieldLabel htmlFor="model-select">Modelo</FieldLabel>
      <div className="grid gap-2" role="radiogroup" aria-label="Modelo">
        {(Object.keys(MODEL_REGISTRY) as ModelKey[]).map((key) => {
          const m = MODEL_REGISTRY[key];
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(key)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-[#7c6cff]/60 bg-[#7c6cff]/[0.12] shadow-[0_0_0_1px_rgba(124,108,255,0.4)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-zinc-100">{m.label}</span>
                <code className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  {m.providerModelId}
                </code>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                {m.description}
              </span>
              {!m.supportsSamplingParams && (
                <span className="mt-1.5 block text-[11px] text-amber-300/90">
                  Nota: este modelo gestiona el muestreo automáticamente; temperature/top-P/top-K
                  pueden ser ignorados por el proveedor.
                </span>
              )}
            </button>
          );
        })}
      </div>
      <HelpText>
        Solo se permiten modelos del registry. El navegador envía la clave (p. ej.{" "}
        <code>flash-latest</code>); el servidor la mapea al identificador real del proveedor.
      </HelpText>
    </div>
  );
}
