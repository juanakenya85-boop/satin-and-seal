import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useDelivery } from "../context/DeliveryContext";
import { api } from "../api/client";

export default function Checkout() {
  const { items, subtotal, refresh } = useCart();
  const { nairobi_fee, outside_fee } = useDelivery();
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const [deliveryLocation] = useState(routerLocation.state?.location || "nairobi");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [form, setForm] = useState({ full_name: "", phone: "", city: "Nairobi", address_line: "", notes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fee = deliveryLocation === "nairobi" ? nairobi_fee : outside_fee;
  const total = subtotal + fee;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function placeOrder() {
    setError("");
    if (!form.full_name || !form.phone || !form.address_line) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }
    setLoading(true);
    try {
      const order = await api.checkout({
        ...form,
        delivery_location: deliveryLocation,
        payment_method: paymentMethod,
      });
      await refresh();
      navigate("/account", { state: { justOrdered: order.id, paymentNote: order.payment_note } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 30 }}>
        <h1 style={{ fontSize: "clamp(26px,3vw,34px)" }}>Checkout</h1>
      </div>

      <div className="wrap layout-sidebar" style={{ paddingBottom: 80 }}>
        <div>
          {error && <div className="error-banner">{error}</div>}

          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 18 }}>1. Delivery Address</h2>
            <div className="field"><label>Full name</label><input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Amara Njoroge" /></div>
            <div className="field-row">
              <div className="field"><label>Phone number</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07•• ••• •••" /></div>
              <div className="field"><label>City / Town</label><input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            </div>
            <div className="field"><label>Delivery address</label><input value={form.address_line} onChange={(e) => set("address_line", e.target.value)} placeholder="Street, building, apartment number" /></div>
            <div className="field"><label>Delivery notes (optional)</label><input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Gate code, landmark, preferred time" /></div>
            <div style={{ display: "flex", gap: 10, background: "var(--bg-alt)", border: "1px solid var(--line)", borderRadius: 2, padding: "13px 15px", fontSize: 12, color: "var(--muted)" }}>
              Your parcel will arrive in plain packaging with no branding, sent from "S&S Nairobi."
            </div>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 18 }}>2. Payment Method</h2>
            <PayOption label="M-Pesa" sub="Pay via STK push to your phone" active={paymentMethod === "mpesa"} onClick={() => setPaymentMethod("mpesa")} />
            {paymentMethod === "mpesa" && (
              <div className="field" style={{ paddingLeft: 44, marginTop: 10 }}>
                <label>M-Pesa phone number</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07•• ••• •••" />
              </div>
            )}
            <PayOption label="Debit / Credit Card" sub="Visa, Mastercard" active={paymentMethod === "card"} onClick={() => setPaymentMethod("card")} />
            <PayOption label="Cash on Delivery" sub="Pay when your order arrives" active={paymentMethod === "cod"} onClick={() => setPaymentMethod("cod")} />
          </div>
        </div>

        <div className="sidebar-card">
          <h2 style={{ fontSize: 18, marginBottom: 18 }}>Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
              <span>{item.product.name} × {item.quantity}</span>
              <span style={{ color: "var(--gold)" }}>{item.line_total.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 6 }}>
            <SumRow label="Subtotal" value={`KSh ${subtotal.toLocaleString()}`} />
            <SumRow label={`Delivery (${deliveryLocation === "nairobi" ? "Nairobi" : "Outside Nairobi"})`} value={`KSh ${fee.toLocaleString()}`} />
            <SumRow label="Total" value={`KSh ${total.toLocaleString()}`} total />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={loading} onClick={placeOrder}>
            {loading ? "Placing order…" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayOption({ label, sub, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      border: `1px solid ${active ? "var(--rose)" : "var(--line)"}`, borderRadius: 2, marginBottom: 10, cursor: "pointer",
      background: active ? "rgba(201,138,147,0.06)" : "transparent"
    }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${active ? "var(--rose)" : "var(--line)"}`, position: "relative", flexShrink: 0 }}>
        {active && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "var(--rose)" }} />}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{sub}</div>
      </div>
    </div>
  );
}

function SumRow({ label, value, total }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: total ? 16 : 13.5, color: total ? "var(--cream)" : "var(--muted)", fontWeight: total ? 700 : 400, marginBottom: 10 }}>
      <span>{label}</span>
      <span style={{ color: total ? "var(--gold)" : "var(--cream)", fontFamily: total ? "Fraunces, serif" : undefined, fontSize: total ? 19 : undefined }}>{value}</span>
    </div>
  );
}
