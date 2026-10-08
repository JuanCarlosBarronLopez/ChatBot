"use client";

import { useState } from "react";
import { AlertTriangle, Eraser, RefreshCw, Settings2, FlaskConical, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessageView } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { EmptyState } from "@/components/chat/EmptyState";
import { ConfigPanel } from "@/components/settings/ConfigPanel";
import { ExperimentLab } from "@/components/lab/ExperimentLab";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/format";

type Tab = "chat" | "lab";

export function ChatContainer() {
  const {
    messages,
    config,
    updateConfig,
    isLoading,
    error,
    sendMessage,
    regenerate,
    clearConversation,
    stop,
    listRef,
  } = useChat();
  const [tab, setTab] = useState<Tab>("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isEmpty = messages.length === 0;

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Main column */}
      <Card className="flex min-h-[560px] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Vistas">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "chat"}
              onClick={() => setTab("chat")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                tab === "chat" ? "bg-[#7c6cff] text-white" : "text-zinc-400 hover:text-zinc-100",
              )}
            >
              Chat
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "lab"}
              onClick={() => setTab("lab")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                tab === "lab" ? "bg-[#7c6cff] text-white" : "text-zinc-400 hover:text-zinc-100",
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Experiment Lab
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="hidden font-mono md:inline-flex">{config.model}</Badge>
            <Button
              variant="subtle"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir configuración"
            >
              <Settings2 className="h-4 w-4" />
              Parámetros
            </Button>
            {tab === "chat" && (
              <>
                <Button
                  variant="subtle"
                  onClick={() => void regenerate()}
                  disabled={isLoading || isEmpty}
                  aria-label="Regenerar última respuesta"
                  title="Regenerar última respuesta"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="subtle"
                  onClick={clearConversation}
                  disabled={isLoading || isEmpty}
                  aria-label="Limpiar conversación"
                  title="Limpiar conversación"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {tab === "chat" ? (
          <>
            <div
              ref={listRef}
              className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
              aria-live="polite"
              aria-label="Historial de mensajes"
            >
              {isEmpty && !isLoading ? (
                <EmptyState onPick={(t) => void sendMessage(t)} />
              ) : (
                messages.map((m) => <ChatMessageView key={m.id} message={m} />)
              )}
              {isLoading && <TypingIndicator />}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => void regenerate()}
                      className="mt-1.5 underline underline-offset-4 hover:text-white"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/[0.07] p-3 sm:p-4">
              <ChatInput
                disabled={false}
                isLoading={isLoading}
                onSend={(t) => void sendMessage(t)}
                onStop={stop}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ExperimentLab baseConfig={config} />
          </div>
        )}
      </Card>

      {/* Side config (desktop) */}
      <Card className="hidden h-fit max-h-[calc(100vh-160px)] overflow-y-auto p-5 lg:block">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
          Parámetros del modelo
        </h2>
        <ConfigPanel config={config} onChange={updateConfig} disabled={isLoading} />
      </Card>

      {/* Drawer (mobile/tablet) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Configuración del modelo">
          <button
            aria-label="Cerrar configuración"
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[92%] max-w-sm flex-col border-l border-white/10 bg-[#121218] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Parámetros del modelo</h2>
              <Button variant="subtle" onClick={() => setDrawerOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConfigPanel config={config} onChange={updateConfig} disabled={isLoading} />
            </div>
            <Button variant="primary" className="mt-4" onClick={() => setDrawerOpen(false)}>
              Aplicar y volver al chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
