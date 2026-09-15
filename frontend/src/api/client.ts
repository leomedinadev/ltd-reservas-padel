// Wrapper fetch tipado: envía siempre la cookie httpOnly de sesión y traduce
// cualquier respuesta no-2xx al mensaje amigable del contrato uniforme
// `{ "error": "..." }` (ver contracts/api.md). Nunca expone detalles técnicos.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let mensaje = "Ocurrió un error inesperado. Intenta de nuevo.";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) mensaje = body.error;
    } catch {
      // respuesta sin cuerpo JSON: se mantiene el mensaje genérico
    }
    throw new ApiError(res.status, mensaje);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
