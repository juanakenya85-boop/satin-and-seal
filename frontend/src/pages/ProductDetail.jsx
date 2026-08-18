import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import { resolveImageUrl } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useDelivery } from "../context/DeliveryContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { nairobi_fee, outside_fee } = useDelivery();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    api.getProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api.getReviews(id).then(setReviews).catch(() => {});
  }, [id]);

  async function handleAdd() {
    try {
      await addItem(product, qty);
      setAdded(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setReviewMessage("");
    try {
      const res = await api.submitReview(id, { rating: reviewRating, comment: reviewComment });
      setReviewMessage(res.message);
      setReviewComment("");
      setReviewRating(5);
    } catch (e) {
      setReviewMessage(e.message);
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Navbar />
        <div className="wrap" style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center" }}>
          <p className="error-banner" style={{ display: "inline-block" }}>{error || "Product not found."}</p>
          <div style={{ marginTop: 16 }}>
            <Link to="/shop" style={{ color: "var(--gold)" }}>← Back to shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const outOfStock = product.quantity <= 0;

  return (
    <div>
      <Navbar active="shop" />

      <div className="wrap" style={{ paddingTop: 20, paddingBottom: 8, fontSize: 13, color: "var(--muted)" }}>
        <Link to="/shop" style={{ color: "var(--muted)" }}>Shop</Link>
        {product.category && <> / <Link to="/shop" style={{ color: "var(--muted)" }}>{product.category.name}</Link></>}
        {" "}/ <span style={{ color: "var(--cream)" }}>{product.name}</span>
      </div>

      <div className="wrap layout-split" style={{ paddingTop: 24, paddingBottom: 60 }}>

        <div style={{
          borderRadius: 12, minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center",
          background: product.image_url ? undefined : "linear-gradient(155deg,#FF6FA5,#7B3FF2)",
          border: "1px solid var(--line)", overflow: "hidden"
        }}>
          {product.image_url ? (
            <img src={resolveImageUrl(product.image_url)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.1" width="120" height="120">
              <path d="M12 21c-4-2.6-8-6-8-10.4A4.6 4.6 0 0112 6a4.6 4.6 0 018 4.6C20 15 16 18.4 12 21z" />
            </svg>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 10 }}>
            {product.category?.name || "Uncategorized"}
          </div>
          <h1 style={{ fontSize: "clamp(26px,3vw,34px)", marginBottom: 12 }}>{product.name}</h1>

          {product.average_rating && (
            <div style={{ fontSize: 13, color: "var(--gold)", marginBottom: 12 }}>
              ★ {product.average_rating} <span style={{ color: "var(--muted)" }}>({product.review_count} review{product.review_count !== 1 ? "s" : ""})</span>
            </div>
          )}

          <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: "var(--gold)", marginBottom: 20 }}>
            KSh {product.price.toLocaleString()}
          </div>

          {product.stock_status === "low_stock" && (
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "var(--warn)", background: "var(--warn-bg)", padding: "5px 12px", borderRadius: 999, marginBottom: 18 }}>
              Only {product.quantity} left in stock
            </div>
          )}
          {outOfStock && (
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "var(--bad)", background: "var(--bad-bg)", padding: "5px 12px", borderRadius: 999, marginBottom: 18 }}>
              Currently out of stock
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.7, marginBottom: 28 }}>
            {product.description || "No description available for this product yet."}
          </p>

          {error && <div className="error-banner">{error}</div>}
          {added && (
            <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "12px 16px", borderRadius: 2, fontSize: 13, marginBottom: 16 }}>
              Added to cart. <Link to="/cart" style={{ color: "var(--good)", textDecoration: "underline" }}>View cart →</Link>
            </div>
          )}

          {!outOfStock && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 2 }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 40, height: 40, background: "transparent", border: "none", color: "var(--cream)", cursor: "pointer", fontSize: 16 }}>−</button>
                <span style={{ width: 40, textAlign: "center", fontSize: 14 }}>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.quantity, q + 1))} style={{ width: 40, height: 40, background: "transparent", border: "none", color: "var(--cream)", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>Add to Cart</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
            <TrustLine text="Plain packaging, no branding on the parcel" />
            <TrustLine text={`Delivery: KSh ${nairobi_fee.toLocaleString()} within Nairobi, KSh ${outside_fee.toLocaleString()} outside`} />
            <TrustLine text="1–3 business days delivery" />
          </div>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 720, paddingBottom: 80 }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Reviews</h2>

        {reviews.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 28 }}>No approved reviews yet — be the first to leave one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.reviewer_name}</span>
                  <span style={{ color: "var(--gold)", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p style={{ fontSize: 13, color: "var(--muted)" }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Write a review</h3>
          {reviewMessage && <p style={{ fontSize: 13, color: "var(--good)", marginBottom: 12 }}>{reviewMessage}</p>}
          <form onSubmit={handleSubmitReview}>
            <div className="field">
              <label>Rating</label>
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Comment (optional)</label>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience with this product" />
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 14 }}>
              Reviews are moderated — yours will appear once approved.
            </p>
            <button type="submit" className="btn btn-primary">Submit Review</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TrustLine({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--muted)" }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.6" width="15" height="15">
        <path d="M20 7l-8-4-8 4v10l8 4 8-4V7z" />
      </svg>
      {text}
    </div>
  );
}

