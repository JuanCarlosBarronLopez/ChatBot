"use client";

import { cn } from "@/lib/utils/format";

export function Button({
  children,
  variant = "ghost",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" &&
          "bg-[#7c6cff] text-white shadow-[0_8px_24px_-8px_rgba(124,108,255,0.7)] hover:bg-[#6a5af0]",
        variant === "ghost" &&
          "border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]",
        variant === "subtle" && "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
        variant === "danger" &&
          "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)]", className)}>
      {children}
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-zinc-200">
      {children}
    </label>
  );
}

export function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{children}</p>;
}
