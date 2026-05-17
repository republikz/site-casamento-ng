import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import crest from "../assets/brasao-ng.svg";

const links = [
  { to: "/", label: "História" },
  { to: "/evento", label: "Evento" },
  { to: "/confirmar", label: "Confirmar" },
  { to: "/presentes", label: "Presentes" },
];

export function SiteShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Ir para a página inicial">
          <img src={crest} alt="" />
          <span>N & G</span>
        </NavLink>

        <button
          className="icon-button mobile-only"
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>

        <nav className={open ? "nav open" : "nav"} aria-label="Navegação principal">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <p>N & G</p>
        <span>Uma celebração desenhada com calma, vinho e histórias boas.</span>
      </footer>
    </div>
  );
}
