import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Rider() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api.getMyDeliveries().then(setOrders).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(orderId, status) {
    try {
      await api.updateDeliveryStatus(orderId, status);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const active = orders.filter((o) => !["delivered", "delivery_failed"].includes(o.status));
  const completed = orders.filter((o) => ["delivered", "delivery_failed"].includes(o.status));

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--cream)" }}>
      <header style={{ borderBottom: "1px solid var(--line)", padding: "20px 0" }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-alt)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 17 }}>P</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>My Deliveries</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{user?.name}</span>
            <button onClick={logout} className="btn btn-ghost" style={{ padding: "7px 16px", fontSize: 12 }}>Log Out</button>
          </div>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 80 }}>
        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 18 }}>Active ({active.length})</h2>
            {active.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 40 }}>No deliveries assigned to you right now.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 44 }}>
                {active.map((o) => <DeliveryCard key={o.id} order={o} onStatusChange={handleStatusChange} />)}
              </div>
            )}

            {completed.length > 0 && (
              <>
                <h2 style={{ fontSize: 18, marginBottom: 18 }}>Completed</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {completed.map((o) => <DeliveryCard key={o.id} order={o} onStatusChange={handleStatusChange} readOnly />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DeliveryCard({ order, onStatusChange, readOnly }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 22, opacity: readOnly ? 0.65 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Order #{order.id}</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 17 }}>{order.address.full_name}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid-2-tight" style={{ marginBottom: 18, fontSize: 13 }}>
        <InfoRow label="Phone" value={order.address.phone} />
        <InfoRow label="Area" value={order.delivery_location === "nairobi" ? "Nairobi" : "Outside Nairobi"} />
        <InfoRow label="Address" value={order.address.address_line} full />
        {order.address.notes && <InfoRow label="Notes" value={order.address.notes} full />}
        <InfoRow label="Items" value={`${order.item_count} item${order.item_count !== 1 ? "s" : ""}`} />
        {order.amount_to_collect != null && (
          <InfoRow label="Collect (Cash)" value={`KSh ${order.amount_to_collect.toLocaleString()}`} highlight />
        )}
      </div>

      {!readOnly && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {order.status !== "out_for_delivery" && (
            <button onClick={() => onStatusChange(order.id, "out_for_delivery")} className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>
              Mark Out for Delivery
            </button>
          )}
          <button onClick={() => onStatusChange(order.id, "delivered")} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 12 }}>
            Mark Delivered
          </button>
          <button onClick={() => onStatusChange(order.id, "delivery_failed")} className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 12, color: "var(--bad)" }}>
            Couldn't Deliver
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, full, highlight }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ color: highlight ? "var(--gold)" : "var(--cream)", fontWeight: highlight ? 700 : 400 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    packed: { label: "Packed", color: "var(--muted)", bg: "var(--bg-alt)" },
    out_for_delivery: { label: "Out for delivery", color: "var(--warn)", bg: "var(--warn-bg)" },
    delivered: { label: "Delivered", color: "var(--good)", bg: "var(--good-bg)" },
    delivery_failed: { label: "Could not deliver", color: "var(--bad)", bg: "var(--bad-bg)" },
  };
  const s = map[status] || map.packed;
  return <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", padding: "5px 12px", borderRadius: 999, background: s.bg, color: s.color }}>{s.label}</span>;
}
