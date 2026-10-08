"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Play, Loader2 } from "lucide-react";
import type { ModelConfig } from "@/types/chat";
import { LIMITS } from "@/lib/constants/limits";
import { MODEL_REGISTRY } from "@/lib/ai/models";
import { formatLatency } from "@/lib/utils/format";
import { Button, Card, Badge, FieldLabel, HelpText } from "@/components/ui/primitives";

interface RunResult {
  label: string;
  ok: boolean;
  reply?: string;
  model?: string;
  latencyMs?: number;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  error?: string;
  params: ModelConfig;
}

const PRESETS: Array<{ id: string; label: string; hint: string; patch: Partial<ModelConfig> }> = [
  {
    id: "temp-low",
    label: "Temperature 0.0 (determinista)",
    hint: "Mismo prompt, mínima aleatoriedad.",
    patch: { temperature: 0 },
  },
  {
    id: "temp-high",
    label: "Temperature 1.5 (creativa)",
    hint: "Mismo prompt, alta variabilidad.",
    patch: { temperature: 1.5 },
  },
  {
    id: "tokens-cut",
    label: "Max tokens 64 (corte visible)",
    hint: "Pide algo largo y observa el truncado.",
    patch: { maxOutputTokens: 64 },
  },
];

export function ExperimentLab({ baseConfig }: { baseConfig: ModelConfig }) {
  const [prompt, setPrompt] = useState(
    "Escribe un microcuento original de ciencia ficción en español.",
  );
  const [systemA, setSystemA] = useState("Eres un asistente preciso y formal.");
  const [systemB, setSystemB] = useState("Eres un pirata entusiasta. Hablas como pirata.");
  const [tempA, setTempA] = useState(0);
  const [tempB, setTempB] = useState(1.5);
  const [maxTokens, setMaxTokens] = useState(512);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runOne(
    label: string,
    params: ModelConfig,
    text: string,
  ): Promise<RunResult> {
    const started = Date.now();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          config: params,
        }),
      });
      const data = (await res.json().catch(() => null)) as RunResult & {
        reply?: string;
        error?: string;
      };
      if (!res.ok) {
        return {
          label,
          ok: false,
          error: typeof data?.error === "string" ? data.error : "Error en la ejecución.",
          params,
          latencyMs: Date.now() - started,
        };
      }
      return {
        label,
        ok: true,
        reply: data?.reply,
        model: data?.model,
        usage: data?.usage,
        latencyMs: data?.latencyMs ?? Date.now() - started,
        params,
      };
    } catch {
      return { label, ok: false, error: "Error de red.", params, latencyMs: Date.now() - started };
    }
  }

  async function runAB(): Promise<void> {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setError(null);
    setResults(null);
    const cfgA: ModelConfig = {
      ...baseConfig,
      systemInstruction: systemA,
      temperature: tempA,
      maxOutputTokens: maxTokens,
    };
    const cfgB: ModelConfig = {
      ...baseConfig,
      systemInstruction: systemB,
      temperature: tempB,
      maxOutputTokens: maxTokens,
    };
    const [a, b] = await Promise.all([
      runOne("Configuración A", cfgA, prompt.trim()),
      runOne("Configuración B", cfgB, prompt.trim()),
    ]);
    setResults([a, b]);
    setRunning(false);
  }

  function applyPreset(p: (typeof PRESETS)[number]): void {
    if (p.id === "temp-low") {
      setTempA(0);
      setTempB(0);
      setSystemA(systemA);
      setSystemB(systemA);
    } else if (p.id === "temp-high") {
      setTempA(0);
      setTempB(1.5);
    } else if (p.id === "tokens-cut") {
      setMaxTokens(64);
      setPrompt(
        "Escribe una historia larga y detallada sobre la exploración espacial, con varios párrafos.",
      );
    }
  }

  return (
    <section aria-label="Experiment Lab" className="flex flex-col gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-zinc-100">Experiment Lab</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
          Ejecuta el mismo prompt con dos configuraciones y compara respuesta, modelo, parámetros,
          tokens y latencia. Sirve para demostrar los tres casos académicos de forma reproducible.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Presets académicos">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            title={p.hint}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 hover:border-[#7c6cff]/40 hover:bg-[#7c6cff]/10"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <FieldLabel htmlFor="lab-prompt">Prompt común</FieldLabel>
        <textarea
          id="lab-prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 text-[13px] text-zinc-100"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-[13px] font-semibold text-zinc-100">Configuración A</h3>
          <div className="mt-3">
            <FieldLabel htmlFor="sys-a">System Instruction A</FieldLabel>
            <textarea
              id="sys-a"
              rows={3}
              value={systemA}
              onChange={(e) => setSystemA(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-zinc-200"
            />
          </div>
          <div className="mt-3">
            <FieldLabel htmlFor="temp-a">Temperature A: {tempA.toFixed(1)}</FieldLabel>
            <input
              id="temp-a"
              type="range"
              min={LIMITS.TEMPERATURE_MIN}
              max={LIMITS.TEMPERATURE_MAX}
              step={0.1}
              value={tempA}
              onChange={(e) => setTempA(Number(e.target.value))}
              className="w-full accent-[#7c6cff]"
            />
          </div>
          <HelpText>
            Modelo: {MODEL_REGISTRY[baseConfig.model as keyof typeof MODEL_REGISTRY]?.providerModelId ?? baseConfig.model}
          </HelpText>
        </Card>
        <Card className="p-4">
          <h3 className="text-[13px] font-semibold text-zinc-100">Configuración B</h3>
          <div className="mt-3">
            <FieldLabel htmlFor="sys-b">System Instruction B</FieldLabel>
            <textarea
              id="sys-b"
              rows={3}
              value={systemB}
              onChange={(e) => setSystemB(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-zinc-200"
            />
          </div>
          <div className="mt-3">
            <FieldLabel htmlFor="temp-b">Temperature B: {tempB.toFixed(1)}</FieldLabel>
            <input
              id="temp-b"
              type="range"
              min={LIMITS.TEMPERATURE_MIN}
              max={LIMITS.TEMPERATURE_MAX}
              step={0.1}
              value={tempB}
              onChange={(e) => setTempB(Number(e.target.value))}
              className="w-full accent-[#7c6cff]"
            />
          </div>
          <HelpText>
            Max tokens común: {maxTokens} · top-P {baseConfig.topP} · top-K {baseConfig.topK}
          </HelpText>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="lab-maxtok" className="text-xs text-zinc-400">
            Max tokens
          </label>
          <input
            id="lab-maxtok"
            type="number"
            min={LIMITS.MAX_OUTPUT_TOKENS_MIN}
            max={LIMITS.MAX_OUTPUT_TOKENS_MAX}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-zinc-100"
          />
        </div>
        <Button variant="primary" onClick={() => void runAB()} disabled={running || !prompt.trim()}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Ejecutando A/B…" : "Ejecutar comparación A/B"}
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-200">
          {error}
        </div>
      )}

      {results && (
        <div className="grid gap-3 md:grid-cols-2" aria-live="polite">
          {results.map((r) => (
            <Card key={r.label} className="flex flex-col p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-zinc-100">{r.label}</h3>
                <Badge>{r.ok ? "OK" : "Error"}</Badge>
              </div>
              <dl className="mt-2 space-y-1 font-mono text-[11px] text-zinc-500">
                <div className="flex justify-between gap-2">
                  <dt>modelo</dt>
                  <dd className="text-zinc-300">{r.model ?? r.params.model}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>params</dt>
                  <dd className="text-right text-zinc-300">
                    T={r.params.temperature} · max={r.params.maxOutputTokens} · p={r.params.topP} · k={r.params.topK}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>latencia</dt>
                  <dd className="text-zinc-300">
                    {typeof r.latencyMs === "number" ? formatLatency(r.latencyMs) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>tokens</dt>
                  <dd className="text-zinc-300">
                    {r.usage?.totalTokens !== undefined
                      ? `${r.usage.inputTokens ?? "?"} in / ${r.usage.outputTokens ?? "?"} out = ${r.usage.totalTokens}`
                      : "no reportado"}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 min-h-[120px] flex-1 rounded-xl border border-white/[0.07] bg-black/30 p-3 text-[13px] leading-relaxed">
                {r.ok && r.reply ? (
                  <div className="md-body text-zinc-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.reply}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-red-300">{r.error ?? "Sin respuesta."}</p>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] text-zinc-600">
                sys: {r.params.systemInstruction.slice(0, 140)}
                {r.params.systemInstruction.length > 140 ? "…" : ""}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
