import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GrillaHoraria } from "../src/components/GrillaHoraria";

function responder(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status });
}

const DISPONIBILIDAD = {
  canchaId: 1,
  fecha: "2099-01-01",
  bloques: [
    { hora: 7, estado: "disponible" },
    { hora: 8, estado: "reservado" },
  ],
};

describe("GrillaHoraria", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("deshabilita los bloques reservados", async () => {
    fetchMock.mockResolvedValue(responder(200, DISPONIBILIDAD));

    render(<GrillaHoraria canchaId={1} fecha="2099-01-01" />);

    expect(await screen.findByRole("button", { name: "07:00" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "08:00" })).toBeDisabled();
  });

  it("muestra el mensaje de la API cuando otro usuario gana el bloque", async () => {
    fetchMock
      .mockResolvedValueOnce(responder(200, DISPONIBILIDAD))
      .mockResolvedValueOnce(responder(409, { error: "Ese horario ya no está disponible." }))
      .mockResolvedValue(responder(200, DISPONIBILIDAD));

    render(<GrillaHoraria canchaId={1} fecha="2099-01-01" />);
    fireEvent.click(await screen.findByRole("button", { name: "07:00" }));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar reserva/ }));

    expect(await screen.findByText("Ese horario ya no está disponible.")).toBeInTheDocument();
  });
});
