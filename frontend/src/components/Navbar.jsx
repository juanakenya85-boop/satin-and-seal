import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ active }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCustomer = user && !user.is_admin && !user.is_rider;
  const isStaff = user?.is_admin || user?.is_rider;

  function initials(name) {
    if (!name) return "?";
    return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate("/");
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50, background: "rgba(255,246,239,0.92)",
      backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)"
    }}>
      <nav className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}>
        <Link to="/" onClick={closeMobileMenu} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "var(--bg-alt)",
            border: "1px solid var(--gold)", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "Fraunces, serif", fontStyle: "italic",
            fontWeight: 500, fontSize: 16, flexShrink: 0
          }}>P</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, whiteSpace: "nowrap" }}>
            Pleasure <em style={{ fontStyle: "italic", color: "var(--rose-soft)", fontWeight: 400 }}>Pop</em>
          </div>
        </Link>

        <div className="nav-links-desktop" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted)" }}>
          <Link to="/shop" style={{ color: active === "shop" ? "var(--cream)" : undefined }}>Shop</Link>
          <Link to="/journal" style={{ color: active === "journal" ? "var(--cream)" : undefined }}>Journal</Link>
          {isCustomer && <Link to="/wishlist" style={{ color: active === "wishlist" ? "var(--cream)" : undefined }}>Wishlist</Link>}
          {isCustomer && <Link to="/account" style={{ color: active === "account" ? "var(--cream)" : undefined }}>My Account</Link>}
          {user?.is_admin && <Link to="/admin" style={{ color: active === "admin" ? "var(--cream)" : undefined }}>Admin Dashboard</Link>}
          {user?.is_rider && <Link to="/rider" style={{ color: active === "rider" ? "var(--cream)" : undefined }}>My Deliveries</Link>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {!isStaff && (
            <Link to="/cart" onClick={closeMobileMenu} className="tap-target" style={{ position: "relative", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }} title="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
                <path d="M3 4h2l2.2 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
                <circle cx="9" cy="20" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="17" cy="20" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              {count > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -8, background: "var(--gold)", color: "var(--bg)",
                  fontSize: 10, fontWeight: 700, width: 15, height: 15, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{count}</span>
              )}
            </Link>
          )}

          {/* Desktop: avatar dropdown */}
          {user ? (
            <div ref={menuRef} className="nav-desktop-only" style={{ position: "relative" }}>
              <div
                onClick={() => setMenuOpen((o) => !o)}
                title={user.name}
                style={{
                  width: 34, height: 34, borderRadius: "50%", background: "var(--rose)", color: "#241522",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}
              >{initials(user.name)}</div>

              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: 46, width: 200,
                  background: "var(--card)", border: "1px solid var(--line-strong)", borderRadius: 8,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)", overflow: "hidden", zIndex: 100
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{user.email}</div>
                  </div>
                  {isCustomer && (
                    <>
                      <Link to="/account" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "11px 16px", fontSize: 13 }}>My Account</Link>
                      <Link to="/wishlist" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "11px 16px", fontSize: 13 }}>Wishlist</Link>
                    </>
                  )}
                  {user.is_admin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "11px 16px", fontSize: 13 }}>Admin Dashboard</Link>
                  )}
                  {user.is_rider && (
                    <Link to="/rider" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "11px 16px", fontSize: 13 }}>My Deliveries</Link>
                  )}
                  <div
                    onClick={handleLogout}
                    style={{ padding: "11px 16px", fontSize: 13, color: "var(--bad)", cursor: "pointer", borderTop: "1px solid var(--line)" }}
                  >Log Out</div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-ghost nav-desktop-only" style={{ padding: "8px 18px" }}>Log In</Link>
          )}

          {/* Mobile: hamburger toggle */}
          <button
            className="nav-hamburger tap-target"
            onClick={() => setMobileMenuOpen((o) => !o)}
            style={{ background: "transparent", border: "none", color: "var(--cream)", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={closeMobileMenu} />
          <div className="mobile-menu-panel">
            <Link to="/shop" onClick={closeMobileMenu}>Shop</Link>
            <Link to="/journal" onClick={closeMobileMenu}>Journal</Link>
            {isCustomer && <Link to="/wishlist" onClick={closeMobileMenu}>Wishlist {count > 0 ? "" : ""}</Link>}
            {!isStaff && <Link to="/cart" onClick={closeMobileMenu}>Cart {count > 0 ? `(${count})` : ""}</Link>}
            {isCustomer && <Link to="/account" onClick={closeMobileMenu}>My Account</Link>}
            {user?.is_admin && <Link to="/admin" onClick={closeMobileMenu}>Admin Dashboard</Link>}
            {user?.is_rider && <Link to="/rider" onClick={closeMobileMenu}>My Deliveries</Link>}
            {user ? (
              <div className="mobile-menu-item" onClick={handleLogout} style={{ color: "var(--bad)", cursor: "pointer" }}>Log Out</div>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} style={{ color: "var(--gold)" }}>Log In</Link>
            )}
          </div>
        </>
      )}
    </header>
  );
}
