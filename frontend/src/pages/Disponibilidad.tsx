import { useState } from "react";
import { Link } from "react-router-dom";
import { CanchaSelector } from "../components/CanchaSelector";
import { SelectorFecha, fechaDeHoy } from "../components/SelectorFecha";
import { GrillaHoraria } from "../components/GrillaHoraria";
import { useAuth } from "../api/authContext";

export function Disponibilidad() {
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(fechaDeHoy());
  const { cerrarSesion } = useAuth();

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Disponibilidad de canchas</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/mis-reservas" className="text-blue-600">
            Mis reservas
          </Link>
          <button type="button" onClick={() => void cerrarSesion()} className="text-gray-600">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="mb-4">
        <CanchaSelector canchaSeleccionada={canchaId} onSeleccionar={setCanchaId} />
      </div>

      <div className="mb-4">
        <SelectorFecha fechaSeleccionada={fecha} onSeleccionar={setFecha} />
      </div>

      {canchaId !== null && (
        <GrillaHoraria key={`${canchaId}-${fecha}`} canchaId={canchaId} fecha={fecha} />
      )}
    </div>
  );
}
