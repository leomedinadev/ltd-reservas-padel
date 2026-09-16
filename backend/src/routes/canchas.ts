import { Router } from "express";
import { requiereAutenticacion } from "../middleware/auth.js";
import { listarCanchas } from "../db/canchas.js";

export const canchasRouter = Router();

// GET /api/canchas — FR-005, contracts/api.md
canchasRouter.get("/", requiereAutenticacion, (_req, res) => {
  res.status(200).json(listarCanchas());
});
