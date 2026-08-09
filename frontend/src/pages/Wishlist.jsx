import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem } = useCart();

  function load() {
    setLoading(true);
    api.getWishlist().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(productId) {
    await api.removeFromWishlist(productId);
    load();
  }

  async function handleAdd(productId) {
    try {
      await addItem(productId, 1);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <Navbar active="wishlist" />

      <div className="wrap" style={{ paddingTop: 50, paddingBottom: 8 }}>
        <h1 style={{ fontSize: "clamp(28px,3.6vw,38px)", marginBottom: 10 }}>Your Wishlist</h1>
        <p style={{ color: "var(--muted)", fontSize: 14.5 }}>Saved for later — nothing here is shared or visible to anyone else.</p>
      </div>

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 80 }}>
        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Nothing saved yet. <Link to="/shop" style={{ color: "var(--gold)" }}>Browse the shop →</Link>
          </div>
        ) : (
          <div className="grid-4">
            {items.map((item) => (
              <div key={item.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 2, overflow: "hidden" }}>
                <Link to={`/product/${item.product.id}`} style={{
                  height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                  background: item.product.image_url ? undefined : "linear-gradient(155deg,#3a2540,#241a2a)", overflow: "hidden"
                }}>
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E4C3C7" strokeWidth="1.3" width="48" height="48">
                      <path d="M12 21c-4-2.6-8-6-8-10.4A4.6 4.6 0 0112 6a4.6 4.6 0 018 4.6C20 15 16 18.4 12 21z" />
                    </svg>
                  )}
                  {item.product.quantity <= 0 && (
                    <span style={{ position: "absolute", top: 12, left: 12, fontSize: 10.5, textTransform: "uppercase", padding: "5px 10px", borderRadius: 999, background: "var(--bad-bg)", color: "var(--bad)" }}>
                      Out of stock
                    </span>
                  )}
                </Link>
                <div style={{ padding: "16px 16px 18px" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 5 }}>{item.product.category?.name}</div>
                  <Link to={`/product/${item.product.id}`} style={{ display: "block", fontFamily: "Fraunces, serif", fontSize: 16, marginBottom: 12 }}>{item.product.name}</Link>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: "var(--gold)" }}>KSh {item.product.price.toLocaleString()}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleRemove(item.product.id)} title="Remove" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--line)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="13" height="13" style={{ margin: "auto" }}><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                      {item.product.quantity > 0 && (
                        <button onClick={() => handleAdd(item.product.id)} title="Add to cart" className="btn btn-primary" style={{ width: 32, height: 32, padding: 0, borderRadius: "50%" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
        &copy; 2026 Satin & Seal, Nairobi. 18+ only.
      </footer>
    </div>
  );
}
