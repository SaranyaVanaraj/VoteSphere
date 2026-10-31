
import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  ArrowRight,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggedIn = Boolean(
    sessionStorage.getItem("token")
  );

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    closeMenu();
    navigate("/login");
  };

  return (
    <header className="vs-header">
      <nav className="vs-navbar">
        <Link
          to="/"
          className="vs-brand"
          onClick={closeMenu}
        >
          <span className="vs-brand-icon">
            <BarChart3 size={23} strokeWidth={2.5} />
          </span>

          <span className="vs-brand-name">
            Vote<span>Sphere</span>
          </span>
        </Link>

        <div className="vs-desktop-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `vs-nav-link ${isActive ? "active" : ""}`
            }
          >
            Home
          </NavLink>

          {isLoggedIn && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `vs-nav-link ${isActive ? "active" : ""}`
                }
              >
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>

              <NavLink
                to="/create"
                className={({ isActive }) =>
                  `vs-nav-link ${isActive ? "active" : ""}`
                }
              >
                <PlusCircle size={17} />
                Create Poll
              </NavLink>
            </>
          )}
        </div>

        <div className="vs-nav-actions">
          <ThemeToggle />

          {isLoggedIn ? (
            <button
              type="button"
              className="vs-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="vs-login-link"
              >
                Log in
              </Link>

              <Link
                to="/signup"
                className="vs-cta-btn"
              >
                Get Started
                <ArrowRight size={17} />
              </Link>
            </>
          )}

          <button
            type="button"
            className="vs-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="vs-mobile-menu"
          >
            {menuOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="vs-mobile-menu"
          id="vs-mobile-menu"
        >
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>

          {isLoggedIn ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/create"
                onClick={closeMenu}
              >
                Create Poll
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={closeMenu}
              >
                Log in
              </NavLink>

              <NavLink
                to="/signup"
                onClick={closeMenu}
              >
                Get Started
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
