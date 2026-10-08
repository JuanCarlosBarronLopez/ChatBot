"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/primitives";

type Status = "checking" | "online" | "needs-key" | "offline";

/**
 * Lightweight server-config probe. It POSTs a deliberately invalid
 * payload: a 400 means the route is alive; a 500 with MISSING_API_KEY
 * means the key is absent. No secrets are ever requested.
 */
export function StatusIndicator() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ probe: true }),
        });
        if (cancelled) return;
        if (res.status === 400) {
          setStatus("online");
          return;
        }
        const data = (await res.json().catch(() => null)) as { code?: string } | null;
        if (data?.code === "MISSING_API_KEY") {
          setStatus("needs-key");
          return;
        }
        // A 500 MISSING_API_KEY can also surface here when body is valid-shaped
        // but the key check happens first; treat any 500 as needs-key check.
        if (res.status === 500) {
          setStatus("needs-key");
          return;
        }
        setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dot =
    status === "online"
      ? "bg-emerald-400"
      : status === "needs-key"
        ? "bg-amber-400"
        : status === "offline"
          ? "bg-red-400"
          : "bg-zinc-500";

  const label =
    status === "online"
      ? "API lista"
      : status === "needs-key"
        ? "Falta GEMINI_API_KEY"
        : status === "offline"
          ? "Sin conexión"
          : "Verificando…";

  return (
    <Badge aria-live="polite" className="gap-2 py-1 pr-3">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`}
        />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label}
    </Badge>
  );
}
