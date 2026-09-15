import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./api/authContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Disponibilidad } from "./pages/Disponibilidad";
import { MisReservas } from "./pages/MisReservas";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/disponibilidad"
            element={
              <ProtectedRoute>
                <Disponibilidad />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-reservas"
            element={
              <ProtectedRoute>
                <MisReservas />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/disponibilidad" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
