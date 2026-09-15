// Constitución Principio VI: un único punto visual para mostrar el mensaje amigable
// de cualquier error de la API en toda la UI (nunca se expone detalle técnico aquí,
// solo el `mensaje` ya amigable que llega de ApiError/contracts/api.md).
export function ErrorNotice({ mensaje }: { mensaje: string }) {
  return (
    <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {mensaje}
    </p>
  );
}
