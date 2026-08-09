import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", age_confirmed: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let loggedInUser;
      if (mode === "login") {
        loggedInUser = await login(form.email, form.password);
      } else {
        if (!form.age_confirmed) {
          setError("You must confirm you are 18 or older to create an account.");
          setLoading(false);
          return;
        }
        loggedInUser = await register(form);
      }
      if (loggedInUser.is_admin) navigate("/admin");
      else if (loggedInUser.is_rider) navigate("/rider");
      else navigate("/account");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-alt)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 16 }}>S</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>Satin <em style={{ color: "var(--rose-soft)", fontStyle: "italic", fontWeight: 400 }}>& Seal</em></div>
        </div>

        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 2, marginBottom: 28, overflow: "hidden" }}>
          <button
            onClick={() => setMode("login")}
            style={{ flex: 1, padding: 12, fontSize: 13, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", border: "none", background: mode === "login" ? "var(--rose)" : "transparent", color: mode === "login" ? "#241522" : "var(--muted)" }}
          >Log In</button>
          <button
            onClick={() => setMode("signup")}
            style={{ flex: 1, padding: 12, fontSize: 13, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", border: "none", background: mode === "signup" ? "var(--rose)" : "transparent", color: mode === "signup" ? "#241522" : "var(--muted)" }}
          >Sign Up</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Amara Njoroge" required />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" required />
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>Phone number</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07•• ••• •••" />
            </div>
          )}

          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" required />
          </div>

          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: 20, marginTop: -10 }}>
              <Link to="/forgot-password" style={{ fontSize: 12.5, color: "var(--gold)" }}>Forgot password?</Link>
            </div>
          )}

          {mode === "signup" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, fontSize: 12.5, color: "var(--muted)" }}>
              <input type="checkbox" checked={form.age_confirmed} onChange={(e) => set("age_confirmed", e.target.checked)} style={{ marginTop: 2 }} />
              <span>I confirm I'm 18+ and agree to the Terms of Service and Privacy Policy.</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
