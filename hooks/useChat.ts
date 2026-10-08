"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ModelConfig } from "@/types/chat";
import { DEFAULT_MODEL_CONFIG } from "@/lib/ai/config";
import { createId } from "@/lib/utils/format";

interface SendResult {
  ok: boolean;
  error?: string;
}

interface UseChatOptions {
  initialConfig?: ModelConfig;
}

function toApiMessages(messages: ChatMessage[]): Array<{ role: "user" | "model"; content: string }> {
  return messages
    .filter((m) => m.role === "user" || m.role === "model")
    .map((m) => ({ role: m.role, content: m.content }));
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<ModelConfig>(options.initialConfig ?? DEFAULT_MODEL_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    } catch {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading, scrollToBottom]);

  const updateConfig = useCallback((patch: Partial<ModelConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendFromMessages = useCallback(
    async (history: ChatMessage[], cfg: ModelConfig): Promise<SendResult> => {
      setIsLoading(true);
      setError(null);
      const controller = new AbortController();
      abortRef.current = controller;
      const started = Date.now();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: toApiMessages(history),
            config: cfg,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          reply?: string;
          model?: string;
          usage?: ChatMessage["usage"];
          latencyMs?: number;
          error?: string;
        } | null;

        if (!res.ok) {
          const msg =
            typeof data?.error === "string" && data.error.length > 0
              ? data.error
              : "No fue posible generar la respuesta. Intenta nuevamente.";
          setError(msg);
          setIsLoading(false);
          return { ok: false, error: msg };
        }

        const replyText = typeof data?.reply === "string" ? data.reply : "";
        if (!replyText) {
          const msg = "El modelo devolvió una respuesta vacía. Intenta nuevamente.";
          setError(msg);
          setIsLoading(false);
          return { ok: false, error: msg };
        }

        const assistant: ChatMessage = {
          id: createId("model"),
          role: "model",
          content: replyText,
          createdAt: new Date().toISOString(),
          usage: data?.usage,
          model: data?.model,
          latencyMs: data?.latencyMs ?? Date.now() - started,
        };
        setMessages((prev) => [...prev, assistant]);
        setIsLoading(false);
        return { ok: true };
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setIsLoading(false);
          return { ok: false, error: "cancelled" };
        }
        const msg = "Error de red. Revisa tu conexión e intenta nuevamente.";
        setError(msg);
        setIsLoading(false);
        return { ok: false, error: msg };
      } finally {
        abortRef.current = null;
      }
    },
    [],
  );

  const regenerate = useCallback(async (): Promise<SendResult> => {
    const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1 || isLoading) return { ok: false };
    const history = messages.slice(0, lastUserIdx + 1);
    setMessages(history);
    return sendFromMessages(history, config);
  }, [messages, isLoading, config, sendFromMessages]);

  const sendMessage = useCallback(
    async (text: string): Promise<SendResult> => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return { ok: false };
      const userMsg: ChatMessage = {
        id: createId("user"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const next = [...messages, userMsg];
      setMessages(next);
      return sendFromMessages(next, config);
    },
    [messages, isLoading, config, sendFromMessages],
  );

  return {
    messages,
    config,
    updateConfig,
    setConfig,
    isLoading,
    error,
    setError,
    sendMessage,
    regenerate,
    clearConversation,
    stop,
    listRef,
    scrollToBottom,
  };
}

export type UseChatReturn = ReturnType<typeof useChat>;
