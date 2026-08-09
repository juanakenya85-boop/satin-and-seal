import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
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

        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Choose a new password</h1>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 28 }}>
          Make it something you haven't used here before.
        </p>

        {error && <div className="error-banner">{error}</div>}

        {success ? (
          <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "16px", borderRadius: 2, fontSize: 13.5 }}>
            Password updated. Redirecting you to log in…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Saving…" : "Update Password"}
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
