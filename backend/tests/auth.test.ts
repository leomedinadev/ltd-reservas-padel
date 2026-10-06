import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/server.js";
import { agenteAutenticado } from "./helpers.js";

describe("autenticación", () => {
  it("registra un usuario sin devolver la contraseña", async () => {
    const res = await request(app)
      .post("/api/auth/registro")
      .send({ email: "Nuevo@Padel.test", password: "clave1234" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), email: "nuevo@padel.test" });
  });

  it("rechaza correos inválidos y contraseñas débiles", async () => {
    const correoInvalido = await request(app)
      .post("/api/auth/registro")
      .send({ email: "sin-arroba", password: "clave1234" });
    const passwordDebil = await request(app)
      .post("/api/auth/registro")
      .send({ email: "debil@padel.test", password: "soloLetras" });

    expect(correoInvalido.status).toBe(400);
    expect(passwordDebil.status).toBe(400);
  });

  it("no permite registrar dos veces el mismo correo, sin importar mayúsculas", async () => {
    await request(app)
      .post("/api/auth/registro")
      .send({ email: "repetido@padel.test", password: "clave1234" })
      .expect(201);

    const res = await request(app)
      .post("/api/auth/registro")
      .send({ email: "REPETIDO@padel.test", password: "clave1234" });

    expect(res.status).toBe(409);
  });

  it("responde igual ante un correo inexistente y una contraseña incorrecta", async () => {
    await request(app)
      .post("/api/auth/registro")
      .send({ email: "login@padel.test", password: "clave1234" })
      .expect(201);

    const noExiste = await request(app)
      .post("/api/auth/login")
      .send({ email: "nadie@padel.test", password: "clave1234" });
    const passwordIncorrecta = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@padel.test", password: "otraClave1" });

    expect(noExiste.status).toBe(401);
    expect(passwordIncorrecta.status).toBe(401);
    expect(noExiste.body).toEqual(passwordIncorrecta.body);
  });

  it("entrega la sesión en una cookie httpOnly", async () => {
    await request(app)
      .post("/api/auth/registro")
      .send({ email: "cookie@padel.test", password: "clave1234" })
      .expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "cookie@padel.test", password: "clave1234" });

    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toContain("session=");
    expect(cookie).toContain("HttpOnly");
  });

  it("rechaza con 401 los endpoints protegidos sin sesión o con un token falso", async () => {
    for (const ruta of ["/api/auth/me", "/api/canchas", "/api/reservas/mias"]) {
      const sinSesion = await request(app).get(ruta);
      const tokenFalso = await request(app).get(ruta).set("Cookie", "session=no-es-un-jwt");

      expect(sinSesion.status).toBe(401);
      expect(tokenFalso.status).toBe(401);
    }
  });

  it("mantiene la sesión hasta cerrar sesión", async () => {
    const agente = await agenteAutenticado("sesion@padel.test");

    const antes = await agente.get("/api/auth/me");
    await agente.post("/api/auth/logout").expect(200);
    const despues = await agente.get("/api/auth/me");

    expect(antes.status).toBe(200);
    expect(antes.body.email).toBe("sesion@padel.test");
    expect(despues.status).toBe(401);
  });
});
