import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bloqueYaTranscurrido, fechaEnVentana, horaValida } from "../src/lib/fechas.js";

describe("fechas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 15 de octubre de 2026, 21:30 hora local: en UTC-5 ya es día 16 en UTC.
    vi.setSystemTime(new Date(2026, 9, 15, 21, 30, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("acepta desde hoy hasta hoy+7 días, en hora local", () => {
    expect(fechaEnVentana("2026-10-15")).toBe(true);
    expect(fechaEnVentana("2026-10-22")).toBe(true);
  });

  it("rechaza fechas fuera de la ventana", () => {
    expect(fechaEnVentana("2026-10-14")).toBe(false);
    expect(fechaEnVentana("2026-10-23")).toBe(false);
  });

  it("rechaza fechas mal formadas o inexistentes", () => {
    expect(fechaEnVentana("15/10/2026")).toBe(false);
    expect(fechaEnVentana("2026-10-15T10:00")).toBe(false);
    expect(fechaEnVentana("2026-10-00")).toBe(false);
  });

  it("rechaza un día inexistente aunque caiga dentro de la ventana", () => {
    vi.setSystemTime(new Date(2026, 9, 28, 10, 0, 0));
    expect(fechaEnVentana("2026-10-31")).toBe(true);
    expect(fechaEnVentana("2026-10-32")).toBe(false);
  });

  it("solo acepta horas enteras dentro del horario del club", () => {
    expect(horaValida(7)).toBe(true);
    expect(horaValida(21)).toBe(true);
    expect(horaValida(6)).toBe(false);
    expect(horaValida(22)).toBe(false);
    expect(horaValida(10.5)).toBe(false);
    expect(horaValida("10")).toBe(false);
  });

  it("marca como transcurridos los bloques de hoy hasta la hora actual", () => {
    vi.setSystemTime(new Date(2026, 9, 15, 10, 30, 0));
    expect(bloqueYaTranscurrido("2026-10-15", 9)).toBe(true);
    expect(bloqueYaTranscurrido("2026-10-15", 10)).toBe(true);
    expect(bloqueYaTranscurrido("2026-10-15", 11)).toBe(false);
    expect(bloqueYaTranscurrido("2026-10-14", 21)).toBe(true);
    expect(bloqueYaTranscurrido("2026-10-16", 7)).toBe(false);
  });
});
