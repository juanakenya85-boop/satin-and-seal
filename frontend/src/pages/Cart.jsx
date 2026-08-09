import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useDelivery } from "../context/DeliveryContext";

export default function Cart() {
  const { items, subtotal, updateItem, removeItem } = useCart();
  const { nairobi_fee, outside_fee } = useDelivery();
  const [location, setLocation] = useState("nairobi");
  const navigate = useNavigate();

  const fee = location === "nairobi" ? nairobi_fee : outside_fee;
  const total = subtotal + fee;

  return (
    <div>
      <Navbar />

      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 30 }}>
        <h1 style={{ fontSize: "clamp(26px,3vw,34px)" }}>Your Cart</h1>
      </div>

      <div className={`wrap ${items.length ? "layout-sidebar" : ""}`} style={{ paddingBottom: 80 }}>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
            Your cart is empty. <span onClick={() => navigate("/shop")} style={{ color: "var(--gold)", cursor: "pointer" }}>Browse the shop →</span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {items.map((item) => (
                <div key={item.id} className="line-item-row" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 18 }}>
                  <div style={{ width: 76, height: 76, borderRadius: 6, flexShrink: 0, background: "linear-gradient(155deg,#3a2540,#241a2a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E4C3C7" strokeWidth="1.3" width="30" height="30">
                      <path d="M12 21c-4-2.6-8-6-8-10.4A4.6 4.6 0 0112 6a4.6 4.6 0 018 4.6C20 15 16 18.4 12 21z" />
                    </svg>
                  </div>
                  <div className="line-item-info">
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>{item.product.category?.name}</div>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, marginBottom: 6 }}>{item.product.name}</div>
                    <div onClick={() => removeItem(item.id)} style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>Remove</div>
                  </div>
                  <div className="line-item-actions">
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 2 }}>
                      <button onClick={() => updateItem(item.id, item.quantity - 1)} style={{ width: 36, height: 36, background: "transparent", border: "none", color: "var(--cream)", cursor: "pointer", fontSize: 15 }}>−</button>
                      <span style={{ width: 32, textAlign: "center", fontSize: 13.5 }}>{item.quantity}</span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)} style={{ width: 36, height: 36, background: "transparent", border: "none", color: "var(--cream)", cursor: "pointer", fontSize: 15 }}>+</button>
                    </div>
                    <div style={{ minWidth: 80, textAlign: "right", fontFamily: "Fraunces, serif", color: "var(--gold)", fontSize: 16 }}>
                      KSh {item.line_total.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sidebar-card">
              <h2 style={{ fontSize: 18, marginBottom: 20 }}>Order Summary</h2>

              <SumRow label={`Subtotal (${items.length} items)`} value={`KSh ${subtotal.toLocaleString()}`} />

              <div style={{ margin: "18px 0" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Delivery location</div>
                <DeliveryOption label="Within Nairobi" fee={nairobi_fee} active={location === "nairobi"} onClick={() => setLocation("nairobi")} />
                <DeliveryOption label="Outside Nairobi" fee={outside_fee} active={location === "outside"} onClick={() => setLocation("outside")} />
              </div>

              <SumRow label="Delivery" value={`KSh ${fee.toLocaleString()}`} />
              <SumRow label="Total" value={`KSh ${total.toLocaleString()}`} total />

              <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => navigate("/checkout", { state: { location } })}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SumRow({ label, value, total }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", fontSize: total ? 16 : 13.5,
      color: total ? "var(--cream)" : "var(--muted)", fontWeight: total ? 700 : 400,
      marginBottom: 12, borderTop: total ? "1px solid var(--line)" : "none", paddingTop: total ? 14 : 0
    }}>
      <span>{label}</span>
      <span style={{ color: total ? "var(--gold)" : "var(--cream)", fontFamily: total ? "Fraunces, serif" : undefined, fontSize: total ? 19 : undefined }}>{value}</span>
    </div>
  );
}

function DeliveryOption({ label, fee, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px",
      border: `1px solid ${active ? "var(--rose)" : "var(--line)"}`, borderRadius: 2, marginBottom: 8, cursor: "pointer",
      background: active ? "rgba(201,138,147,0.06)" : "transparent"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${active ? "var(--rose)" : "var(--line)"}`, position: "relative" }}>
          {active && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "var(--rose)" }} />}
        </div>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>KSh {fee.toLocaleString()}</div>
    </div>
  );
}
