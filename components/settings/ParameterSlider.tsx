"use client";

import { FieldLabel, HelpText } from "@/components/ui/primitives";

interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  help: string;
  disabled?: boolean;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function ParameterSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  help,
  disabled,
  onChange,
  format,
}: Props) {
  const display = format ? format(value) : String(value);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <output
          htmlFor={id}
          aria-live="polite"
          className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-xs text-[#a5a0ff]"
        >
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#7c6cff]"
        aria-describedby={`${id}-help`}
      />
      <div className="flex justify-between font-mono text-[10px] text-zinc-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <HelpText>
        <span id={`${id}-help`}>{help}</span>
      </HelpText>
    </div>
  );
}
