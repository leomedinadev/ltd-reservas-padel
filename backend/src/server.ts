import express from "express";
import cookieParser from "cookie-parser";
import { manejadorGlobalDeErrores } from "./lib/errors.js";
import { seedCanchas } from "./db/seedCanchas.js";
import { authRouter } from "./routes/auth.js";
import { canchasRouter } from "./routes/canchas.js";
import { disponibilidadRouter } from "./routes/disponibilidad.js";
import { reservasRouter } from "./routes/reservas.js";

seedCanchas();

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/canchas", canchasRouter);
app.use("/api/disponibilidad", disponibilidadRouter);
app.use("/api/reservas", reservasRouter);

app.use(manejadorGlobalDeErrores);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
  });
}
