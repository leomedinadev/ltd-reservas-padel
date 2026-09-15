import { Router } from "express";
import { requiereAutenticacion, type RequestAutenticado } from "../middleware/auth.js";
import { hashPassword, passwordValida, verificarPassword } from "../lib/password.js";
import { crearUsuario, buscarUsuarioPorEmail } from "../db/usuarios.js";
import { firmarSesion } from "../lib/token.js";
import { enviarError } from "../lib/errors.js";

export const authRouter = Router();

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPCIONES = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /api/auth/registro — FR-001, contracts/api.md
authRouter.post("/registro", async (req, res) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || !EMAIL_VALIDO.test(email)) {
    enviarError(res, 400, "Ingresa un correo electrónico válido.");
    return;
  }
  if (typeof password !== "string" || !passwordValida(password)) {
    enviarError(
      res,
      400,
      "La contraseña debe tener al menos 8 caracteres, con una letra y un número.",
    );
    return;
  }

  if (buscarUsuarioPorEmail(email)) {
    enviarError(res, 409, "Este correo ya está registrado.");
    return;
  }

  const passwordHash = await hashPassword(password);
  const usuario = crearUsuario(email, passwordHash);
  res.status(201).json({ id: usuario.id, email: usuario.email });
});

// POST /api/auth/login — FR-002, contracts/api.md
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };
  const mensajeGenerico = "Correo o contraseña incorrectos.";

  if (typeof email !== "string" || typeof password !== "string") {
    enviarError(res, 401, mensajeGenerico);
    return;
  }

  const usuario = buscarUsuarioPorEmail(email);
  if (!usuario) {
    enviarError(res, 401, mensajeGenerico);
    return;
  }

  const passwordCorrecta = await verificarPassword(password, usuario.password_hash);
  if (!passwordCorrecta) {
    enviarError(res, 401, mensajeGenerico);
    return;
  }

  const token = firmarSesion({ usuarioId: usuario.id, email: usuario.email });
  res.cookie("session", token, COOKIE_OPCIONES);
  res.status(200).json({ id: usuario.id, email: usuario.email });
});

// POST /api/auth/logout — contracts/api.md
authRouter.post("/logout", requiereAutenticacion, (_req, res) => {
  res.clearCookie("session", COOKIE_OPCIONES);
  res.status(200).json({});
});

// GET /api/auth/me: ver contracts/api.md — permite a la SPA verificar, tras un F5,
// si la cookie httpOnly de sesión sigue siendo válida (FR-003). El id/email viajan
// en el propio JWT, así que no requiere consultar la base de datos.
authRouter.get("/me", requiereAutenticacion, (req, res) => {
  const { usuarioId, usuarioEmail } = req as RequestAutenticado;
  res.status(200).json({ id: usuarioId, email: usuarioEmail });
});
