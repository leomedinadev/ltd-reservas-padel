import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bloqueYaTranscurrido, fechaLocalISO } from "../src/lib/fechas";

describe("fechas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 21, 30, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa la fecha local aunque en UTC ya sea el día siguiente", () => {
    expect(fechaLocalISO(new Date())).toBe("2026-10-15");
  });

  it("marca como transcurridos los bloques de hoy hasta la hora actual", () => {
    expect(bloqueYaTranscurrido("2026-10-15", 21)).toBe(true);
    expect(bloqueYaTranscurrido("2026-10-14", 21)).toBe(true);
    expect(bloqueYaTranscurrido("2026-10-16", 7)).toBe(false);
  });
});
