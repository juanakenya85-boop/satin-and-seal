import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Account() {
  const { user } = useAuth();
  const routerLocation = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const latestOrder = orders[0];
  const justOrderedId = routerLocation.state?.justOrdered;
  const paymentNote = routerLocation.state?.paymentNote;

  return (
    <div>
      <Navbar active="account" />

      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 8 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>Welcome back</div>
        <h1 style={{ fontSize: "clamp(28px,3.6vw,38px)", marginBottom: 6 }}>Hi {user?.name?.split(" ")[0] || "there"}, good to see you.</h1>
        {justOrderedId && (
          <p style={{ color: "var(--good)", fontSize: 14, marginTop: 8 }}>
            ✓ Order #{justOrderedId} confirmed — thank you!
          </p>
        )}
        {paymentNote && (
          <div style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "var(--muted)", marginTop: 12, maxWidth: 460 }}>
            {paymentNote}
          </div>
        )}
      </div>

      <section className="wrap" style={{ paddingTop: 36, paddingBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22 }}>
          <h2 style={{ fontSize: 22 }}>Your Orders</h2>
          <Link to="/shop" style={{ fontSize: 13, color: "var(--gold)" }}>Continue shopping</Link>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 30, textAlign: "center", color: "var(--muted)" }}>
            No orders yet. <Link to="/shop" style={{ color: "var(--gold)" }}>Start shopping →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((order) => (
              <div key={order.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                      Order #{order.id} &middot; {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, marginBottom: 6 }}>
                      {order.items.length} item{order.items.length > 1 ? "s" : ""} &middot; KSh {order.total.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      Delivering to {order.address.city} &middot; Plain packaging
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
                    <StatusPill status={order.status} />
                    {order.payment_status && order.payment_status !== "paid" && (
                      <PaymentPill status={order.payment_status} />
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                      {item.product_name} × {item.quantity} — KSh {item.line_total.toLocaleString()}
                    </div>
                  ))}
                </div>
                <Tracker status={order.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="wrap" style={{ paddingTop: 10, paddingBottom: 56 }}>
        <h2 style={{ fontSize: 22, marginBottom: 22 }}>Account Overview</h2>
        <div className="grid-3-feature" style={{ gap: 16 }}>
          <InfoCard title="Contact" val={user?.email} sub={user?.phone} />
          <InfoCard title="Payment" val="M-Pesa" sub="Default payment method" />
          <InfoCard title="Privacy" val="Plain packaging: On" sub="Generic sender name on parcels" />
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }) {
  const labels = { confirmed: "Confirmed", packed: "Packed", out_for_delivery: "Out for delivery", delivered: "Delivered" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, textTransform: "uppercase",
      padding: "6px 14px", borderRadius: 999, background: "var(--good-bg)", color: "var(--good)",
      border: "1px solid rgba(143,174,124,0.3)"
    }}>{labels[status] || status}</span>
  );
}

function PaymentPill({ status }) {
  const map = {
    pending: { label: "Payment pending", color: "var(--warn)", bg: "var(--warn-bg)" },
    manual: { label: "Payment: contact us", color: "var(--warn)", bg: "var(--warn-bg)" },
    failed: { label: "Payment failed", color: "var(--bad)", bg: "var(--bad-bg)" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", fontSize: 11, textTransform: "uppercase",
      padding: "5px 12px", borderRadius: 999, background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function InfoCard({ title, val, sub }) {
  return (
    <div style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", borderRadius: 2, padding: 20 }}>
      <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 12, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{title}</h3>
      <div style={{ fontSize: 14, marginBottom: 4 }}>{val}</div>
      <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

const STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function Tracker({ status }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
            {i < STEPS.length - 1 && (
              <div style={{ position: "absolute", top: 5, left: "50%", width: "100%", height: 2, background: i < currentIndex ? "var(--good)" : "var(--line)", zIndex: 1 }} />
            )}
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: done ? "var(--good)" : "var(--bg)", border: `2px solid ${done ? "var(--good)" : "var(--line)"}`, zIndex: 2 }} />
            <div style={{ fontSize: 11, color: done ? "var(--cream)" : "var(--muted)", marginTop: 8, textAlign: "center" }}>{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
