import request from "supertest";
import { app } from "../src/server.js";

const PASSWORD = "clave1234";

// Fecha local de hoy + `dias`, en formato YYYY-MM-DD.
export function fechaEnDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Registra un usuario, inicia sesión y devuelve un agente que conserva la cookie.
export async function agenteAutenticado(email: string) {
  const agente = request.agent(app);
  await agente.post("/api/auth/registro").send({ email, password: PASSWORD }).expect(201);
  await agente.post("/api/auth/login").send({ email, password: PASSWORD }).expect(200);
  return agente;
}
