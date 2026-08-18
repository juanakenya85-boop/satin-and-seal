import { useEffect, useState } from "react";
import { useParams, useSearchParams, useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const routerLocation = useLocation();
  const email = searchParams.get("email") || "";

  // If we arrived straight from checkout, the order is already in router
  // state — no need to re-fetch. Otherwise (e.g. page refresh), look it up.
  const [order, setOrder] = useState(routerLocation.state?.order || null);
  const [paymentNote] = useState(routerLocation.state?.paymentNote || null);
  const [loading, setLoading] = useState(!routerLocation.state?.order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (order) return;
    api.getGuestOrder(orderId, email)
      .then(setOrder)
      .catch(() => setError("We couldn't find that order. Double-check the link, or the email you used at checkout."))
      .finally(() => setLoading(false));
  }, [orderId, email, order]);

  return (
    <div>
      <Navbar />
      <div className="wrap" style={{ maxWidth: 640, paddingTop: 60, paddingBottom: 90 }}>
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : order ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--good-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--good)" strokeWidth="2" width="26" height="26"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h1 style={{ fontSize: "clamp(24px,3vw,32px)", marginBottom: 10 }}>Order confirmed</h1>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Order #{order.id} — a confirmation has been noted for {order.guest_email}</p>
            </div>

            {paymentNote && (
              <div style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", borderRadius: 8, padding: "14px 18px", fontSize: 13.5, color: "var(--muted)", marginBottom: 28 }}>
                {paymentNote}
              </div>
            )}

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>Order summary</h2>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 10 }}>
                  <span>{item.product_name} × {item.quantity}</span>
                  <span style={{ color: "var(--gold)" }}>KSh {item.line_total.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--muted)", marginBottom: 8 }}>
                  <span>Subtotal</span><span>KSh {order.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--muted)", marginBottom: 8 }}>
                  <span>Delivery</span><span>KSh {order.delivery_fee.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                  <span>Total</span><span style={{ color: "var(--gold)", fontFamily: "Fraunces, serif", fontSize: 19 }}>KSh {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 24, marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Delivering to</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
                {order.address.full_name}<br />
                {order.address.address_line}, {order.address.city}<br />
                {order.address.phone}
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 18 }}>
                Save this page's link to check back on your order — since you checked out as a guest, it isn't tied to an account.
                Want order tracking and a saved address for next time? <Link to="/login" style={{ color: "var(--gold)" }}>Create an account</Link>.
              </p>
              <Link to="/shop" className="btn btn-ghost">Continue Shopping</Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
