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

// Edge Cases (spec.md: "la sesión del usuario expira mientras está en medio del
// flujo de reserva") / FR-003: cuando cualquier endpoint protegido responde 401 a
// mitad de un flujo (no el propio /api/auth/*, que ya maneja su 401 localmente),
// authContext.tsx se suscribe aquí para limpiar la sesión; ProtectedRoute ya
// redirige a /login apenas el usuario de sesión queda en null, sin que este módulo
// necesite conocer el router.
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
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
    if (res.status === 401 && !path.startsWith("/api/auth/")) {
      onSessionExpired?.();
    }
    throw new ApiError(res.status, mensaje);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
