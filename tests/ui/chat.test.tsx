import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "@/app/page";

// Network stub for /api/chat used by useChat + StatusIndicator probe.
function mockFetchSuccess(reply = "Respuesta de prueba") {
  return vi.fn(async (url: unknown, init?: { body?: string }) => {
    const u = String(url);
    if (u === "/api/chat" && init?.body === JSON.stringify({ probe: true })) {
      return { status: 400, ok: false, json: async () => ({ code: "VALIDATION_ERROR" }) };
    }
    return {
      status: 200,
      ok: true,
      json: async () => ({
        reply,
        model: "gemini-3.5-flash",
        usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
        latencyMs: 123,
      }),
    };
  });
}

describe("chat UI", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchSuccess());
    // clipboard stub for MessageActions
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("sends on Enter and shows the reply", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const box = screen.getByLabelText(/Escribe tu mensaje/i);
    await user.click(box);
    await user.type(box, "Hola Gemini{Enter}");
    await waitFor(() => expect(screen.getByText("Respuesta de prueba")).toBeInTheDocument());
  });

  it("Shift+Enter inserts a newline instead of sending", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const box = screen.getByLabelText(/Escribe tu mensaje/i) as HTMLTextAreaElement;
    await user.click(box);
    await user.keyboard("línea1{Shift>}{Enter}{/Shift}línea2");
    expect(box.value).toContain("línea1");
    expect(box.value).toContain("línea2");
    expect(screen.queryByText("Respuesta de prueba")).not.toBeInTheDocument();
  });

  it("shows empty state and clears conversation", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    expect(screen.getByText(/Empieza una conversación/i)).toBeInTheDocument();
    const box = screen.getByLabelText(/Escribe tu mensaje/i);
    await user.type(box, "hola{Enter}");
    await waitFor(() => expect(screen.getByText("Respuesta de prueba")).toBeInTheDocument());
    const clear = screen.getByLabelText(/Limpiar conversación/i);
    await user.click(clear);
    expect(screen.getByText(/Empieza una conversación/i)).toBeInTheDocument();
  });

  it("exposes temperature slider in the config panel", async () => {
    render(<HomePage />);
    // Desktop panel is hidden on small viewports in jsdom? Query all sliders.
    const sliders = screen.getAllByLabelText(/Temperature/i);
    expect(sliders.length).toBeGreaterThan(0);
  });
});
