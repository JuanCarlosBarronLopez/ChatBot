"use client";

import { Header } from "@/components/layout/Header";
import { StatusIndicator } from "@/components/layout/StatusIndicator";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-3 sm:px-5 lg:px-8">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
              Laboratorio de conversación con Gemini
            </h1>
            <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
              Chat full-stack con parámetros controlables, validación server-side y Experiment
              Lab para demostrar System Instructions, tokens y temperatura.
            </p>
          </div>
          <StatusIndicator />
        </div>
        <ChatContainer />
        <footer className="mt-1 text-center text-[11px] text-zinc-600">
          La API key vive solo en el servidor · Los parámetros se validan y normalizan en{" "}
          <code className="rounded bg-white/5 px-1">/api/chat</code> · Hecho con Next.js + Gemini
        </footer>
      </main>
    </div>
  );
}
