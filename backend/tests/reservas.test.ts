import { describe, expect, it } from "vitest";
import { agenteAutenticado, fechaEnDias } from "./helpers.js";

// Cada test usa una cancha/hora distinta de mañana para no interferir con los demás.
const MANANA = fechaEnDias(1);

describe("reservas", () => {
  it("crea una reserva y marca el bloque como reservado", async () => {
    const agente = await agenteAutenticado("crea@padel.test");

    const res = await agente.post("/api/reservas").send({ canchaId: 1, fecha: MANANA, hora: 10 });
    const disponibilidad = await agente.get(`/api/disponibilidad?canchaId=1&fecha=${MANANA}`);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ canchaId: 1, fecha: MANANA, hora: 10, estado: "activa" });
    const bloque = disponibilidad.body.bloques.find((b: { hora: number }) => b.hora === 10);
    expect(bloque.estado).toBe("reservado");
    expect(disponibilidad.body.bloques).toHaveLength(15);
  });

  it("impide que dos usuarios reserven el mismo bloque (colisión)", async () => {
    const ana = await agenteAutenticado("ana@padel.test");
    const beto = await agenteAutenticado("beto@padel.test");

    await ana.post("/api/reservas").send({ canchaId: 2, fecha: MANANA, hora: 11 }).expect(201);
    const res = await beto.post("/api/reservas").send({ canchaId: 2, fecha: MANANA, hora: 11 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Ese horario ya no está disponible.");
  });

  it("solo deja ganar a uno cuando dos usuarios reservan a la vez", async () => {
    const carla = await agenteAutenticado("carla@padel.test");
    const dani = await agenteAutenticado("dani@padel.test");
    const reserva = { canchaId: 3, fecha: MANANA, hora: 12 };

    const respuestas = await Promise.all([
      carla.post("/api/reservas").send(reserva),
      dani.post("/api/reservas").send(reserva),
    ]);

    expect(respuestas.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it("no permite más de una reserva activa por usuario", async () => {
    const agente = await agenteAutenticado("una@padel.test");

    await agente.post("/api/reservas").send({ canchaId: 4, fecha: MANANA, hora: 13 }).expect(201);
    const res = await agente.post("/api/reservas").send({ canchaId: 5, fecha: MANANA, hora: 14 });

    expect(res.status).toBe(409);
  });

  it("valida cancha, fecha y hora", async () => {
    const agente = await agenteAutenticado("valida@padel.test");

    const invalidas = [
      { canchaId: 6, fecha: MANANA, hora: 10 },
      { canchaId: "1", fecha: MANANA, hora: 10 },
      { canchaId: 1, fecha: fechaEnDias(-1), hora: 10 },
      { canchaId: 1, fecha: fechaEnDias(8), hora: 10 },
      { canchaId: 1, fecha: MANANA, hora: 22 },
      { canchaId: 1, fecha: MANANA, hora: 10.5 },
    ];

    for (const cuerpo of invalidas) {
      const res = await agente.post("/api/reservas").send(cuerpo);
      expect(res.status).toBe(400);
    }
  });

  it("al cancelar libera el bloque y permite reservar de nuevo", async () => {
    const agente = await agenteAutenticado("cancela@padel.test");
    const creada = await agente.post("/api/reservas").send({ canchaId: 5, fecha: MANANA, hora: 15 });

    const cancelada = await agente.delete(`/api/reservas/${creada.body.id}`);
    const repetida = await agente.delete(`/api/reservas/${creada.body.id}`);
    const nueva = await agente.post("/api/reservas").send({ canchaId: 5, fecha: MANANA, hora: 15 });
    const mias = await agente.get("/api/reservas/mias");

    expect(cancelada.status).toBe(200);
    expect(cancelada.body.estado).toBe("cancelada");
    expect(repetida.status).toBe(409);
    expect(nueva.status).toBe(201);
    expect(mias.body.futuras).toHaveLength(1);
    expect(mias.body.pasadas).toHaveLength(1);
  });

  it("no permite cancelar la reserva de otro usuario", async () => {
    const duenio = await agenteAutenticado("duenio@padel.test");
    const intruso = await agenteAutenticado("intruso@padel.test");
    const creada = await duenio.post("/api/reservas").send({ canchaId: 1, fecha: MANANA, hora: 16 });

    const ajena = await intruso.delete(`/api/reservas/${creada.body.id}`);
    const inexistente = await intruso.delete("/api/reservas/999999");

    expect(ajena.status).toBe(403);
    expect(inexistente.status).toBe(404);
  });
});
