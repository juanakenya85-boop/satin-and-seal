import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
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

        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Reset your password</h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 28 }}>
            Enter the email on your account and we'll send you a link to choose a new password.
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {submitted ? (
          <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "16px", borderRadius: 2, fontSize: 13.5, marginBottom: 20 }}>
            If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          <Link to="/login" style={{ color: "var(--gold)" }}>← Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
