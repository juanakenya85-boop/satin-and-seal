import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getProducts({ featured: "top_selling", limit: 5 }).then(setTopSelling).catch(() => {});
    api.getProducts({ featured: "new", limit: 5 }).then(setNewArrivals).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.getWishlist().then((items) => setWishlistIds(new Set(items.map((i) => i.product.id)))).catch(() => {});
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory !== "all") params.category = activeCategory;
    if (sort) params.sort = sort;
    api.getProducts(params)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeCategory, sort]);

  function selectCategory(slug) {
    setActiveCategory(slug);
    setSearchParams(slug === "all" ? {} : { category: slug });
  }

  async function handleAdd(product) {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await addItem(product.id, 1);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleToggleSave(product) {
    if (!user) {
      navigate("/login");
      return;
    }
    const isSaved = wishlistIds.has(product.id);
    const next = new Set(wishlistIds);
    if (isSaved) {
      next.delete(product.id);
      setWishlistIds(next);
      await api.removeFromWishlist(product.id).catch(() => {});
    } else {
      next.add(product.id);
      setWishlistIds(next);
      await api.addToWishlist(product.id).catch(() => {});
    }
  }

  return (
    <div>
      <Navbar active="shop" />

      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 0 }}>
        <h1 style={{ fontSize: "clamp(28px,3.4vw,38px)", marginBottom: 8 }}>The Collection</h1>
        <p style={{ color: "var(--muted)", fontSize: 14.5 }}>
          Every item vetted for quality and comfort. Sold-out pieces are hidden automatically.
        </p>
      </div>

      <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, margin: "28px 0 6px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Chip label="All" active={activeCategory === "all"} onClick={() => selectCategory("all")} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} active={activeCategory === c.slug} onClick={() => selectCategory(c.slug)} />
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--cream)", padding: "8px 12px", borderRadius: 2, fontSize: 13 }}>
          <option value="">Recommended</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {error && <div className="wrap"><div className="error-banner">{error}</div></div>}

      {topSelling.length > 0 && (
        <Rail title="Top Selling" tag="This week" products={topSelling} onAdd={handleAdd} rank wishlistIds={wishlistIds} onToggleSave={handleToggleSave} />
      )}
      {newArrivals.length > 0 && (
        <Rail title="New Arrivals" tag="Just in" products={newArrivals} onAdd={handleAdd} badge="New" wishlistIds={wishlistIds} onToggleSave={handleToggleSave} />
      )}

      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 20 }}>
        <h2 style={{ fontSize: 22, marginBottom: 22 }}>All Products</h2>
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No products found in this category.</p>
        ) : (
          <div className="grid-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} saved={wishlistIds.has(p.id)} onToggleSave={handleToggleSave} />
            ))}
          </div>
        )}
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12.5, marginTop: 30 }}>
          Sold-out items are automatically removed from the shop until restocked.
        </p>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
        &copy; 2026 Satin & Seal, Nairobi. 18+ only.
      </footer>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "9px 18px", fontSize: 13, borderRadius: 999, cursor: "pointer",
        border: `1px solid ${active ? "var(--rose)" : "var(--line)"}`,
        color: active ? "var(--rose-soft)" : "var(--muted)",
        background: active ? "rgba(201,138,147,0.08)" : "transparent",
      }}
    >{label}</div>
  );
}

function Rail({ title, tag, products, onAdd, rank, badge, wishlistIds, onToggleSave }) {
  return (
    <section className="wrap" style={{ paddingTop: 44, paddingBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ fontSize: 22 }}>{title}</h2>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gold)", border: "1px solid rgba(201,167,104,0.3)", padding: "4px 10px", borderRadius: 999 }}>{tag}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 8 }}>
        {products.map((p, i) => (
          <div key={p.id} style={{ flex: "0 0 240px" }}>
            <ProductCard product={p} onAdd={onAdd} badge={rank ? `#${i + 1} Bestseller` : badge} saved={wishlistIds.has(p.id)} onToggleSave={onToggleSave} />
          </div>
        ))}
      </div>
    </section>
  );
}
