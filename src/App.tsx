import { Navigate, Route, Routes } from "react-router-dom";
import { SiteShell } from "./components/SiteShell";
import { AdminPage } from "./pages/AdminPage";
import { EventPage } from "./pages/EventPage";
import { GiftsPage } from "./pages/GiftsPage";
import { HomePage } from "./pages/HomePage";
import { RSVPPage } from "./pages/RSVPPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route index element={<HomePage />} />
        <Route path="/evento" element={<EventPage />} />
        <Route path="/confirmar" element={<RSVPPage />} />
        <Route path="/presentes" element={<GiftsPage />} />
      </Route>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
