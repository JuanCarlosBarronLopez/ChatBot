import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemini Chat Lab — Laboratorio de interacción con LLM",
  description:
    "Pequeño laboratorio profesional de interacción con Gemini: chatbot, control de parámetros y Experiment Lab.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
