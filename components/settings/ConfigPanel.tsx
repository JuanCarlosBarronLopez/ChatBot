"use client";

import { RotateCcw } from "lucide-react";
import type { ModelConfig } from "@/types/chat";
import { LIMITS } from "@/lib/constants/limits";
import { DEFAULT_MODEL_CONFIG } from "@/lib/ai/config";
import { ModelSelector } from "@/components/settings/ModelSelector";
import type { ModelKey } from "@/lib/ai/models";
import { ParameterSlider } from "@/components/settings/ParameterSlider";
import { FieldLabel, HelpText, Button } from "@/components/ui/primitives";

interface Props {
  config: ModelConfig;
  onChange: (patch: Partial<ModelConfig>) => void;
  disabled?: boolean;
}

export function ConfigPanel({ config, onChange, disabled }: Props) {
  return (
    <section aria-label="Configuración del modelo" className="flex flex-col gap-5">
      <ModelSelector
        value={config.model}
        disabled={disabled}
        onChange={(key: ModelKey) => onChange({ model: key })}
      />

      <div>
        <FieldLabel htmlFor="system-instruction">System Instruction</FieldLabel>
        <textarea
          id="system-instruction"
          rows={4}
          disabled={disabled}
          value={config.systemInstruction}
          onChange={(e) => onChange({ systemInstruction: e.target.value })}
          maxLength={LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS}
          placeholder="Ej.: Respondes como un tutor paciente de programación…"
          className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-[13px] leading-relaxed text-zinc-200 placeholder:text-zinc-600"
        />
        <div className="mt-1 flex items-center justify-between">
          <HelpText>
            Guía el comportamiento del modelo en cada respuesta. Caso académico 1: cambia esto y
            observa el cambio de tono/rol.
          </HelpText>
        </div>
        <p className="mt-1 text-right font-mono text-[10px] text-zinc-600" aria-live="polite">
          {config.systemInstruction.length}/{LIMITS.MAX_SYSTEM_INSTRUCTION_CHARS}
        </p>
      </div>

      <ParameterSlider
        id="temperature"
        label="Temperature"
        value={config.temperature}
        min={LIMITS.TEMPERATURE_MIN}
        max={LIMITS.TEMPERATURE_MAX}
        step={0.1}
        disabled={disabled}
        onChange={(v) => onChange({ temperature: v })}
        format={(v) => v.toFixed(1)}
        help="0 = determinista, 2 = muy creativo. Caso académico 3: compara 0.0 vs 1.5 con el mismo prompt."
      />

      <ParameterSlider
        id="max-tokens"
        label="Max Output Tokens"
        value={config.maxOutputTokens}
        min={64}
        max={LIMITS.MAX_OUTPUT_TOKENS_MAX}
        step={64}
        disabled={disabled}
        onChange={(v) => onChange({ maxOutputTokens: v })}
        help="Límite de longitud de la respuesta. Caso académico 2: pon 64 y pide un texto largo para ver el corte."
      />

      <ParameterSlider
        id="top-p"
        label="Top-P"
        value={config.topP}
        min={LIMITS.TOP_P_MIN}
        max={LIMITS.TOP_P_MAX}
        step={0.05}
        disabled={disabled}
        onChange={(v) => onChange({ topP: v })}
        format={(v) => v.toFixed(2)}
        help="Muestreo por núcleo: menor = más conservador. Google recomienda no mover T, top-P y top-K a la vez."
      />

      <ParameterSlider
        id="top-k"
        label="Top-K"
        value={config.topK}
        min={LIMITS.TOP_K_MIN}
        max={LIMITS.TOP_K_MAX}
        step={1}
        disabled={disabled}
        onChange={(v) => onChange({ topK: v })}
        help="En cada paso solo se consideran los K tokens más probables. 1 = greedy decoding."
      />

      <div className="rounded-xl border border-white/10 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-200/90">
        En Gemini 3.x el proveedor recomienda dejar estos valores por defecto cuando no se
        experimenta. Aquí son configurables a propósito para la práctica: el comportamiento exacto
        depende del modelo elegido.
      </div>

      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => onChange({ ...DEFAULT_MODEL_CONFIG })}
      >
        <RotateCcw className="h-4 w-4" />
        Restablecer valores
      </Button>
    </section>
  );
}
