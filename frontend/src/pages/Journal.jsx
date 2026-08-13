import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import { resolveImageUrl } from "../api/client";

export default function Journal() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlogPosts().then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar active="journal" />

      <div className="wrap" style={{ paddingTop: 50, paddingBottom: 8 }}>
        <h1 style={{ fontSize: "clamp(28px,3.6vw,38px)", marginBottom: 10 }}>The Journal</h1>
        <p style={{ color: "var(--muted)", fontSize: 14.5 }}>
          Honest, practical reading on intimacy, care, and connection.
        </p>
      </div>

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 80 }}>
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No posts yet — check back soon.</p>
        ) : (
          <div className="grid-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/journal/${post.slug}`} style={{
                background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden",
                display: "block"
              }}>
                <div style={{ height: 160, background: post.cover_image_url ? undefined : "linear-gradient(155deg,#3a2540,#241a2a)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {post.cover_image_url ? (
                    <img src={resolveImageUrl(post.cover_image_url)} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E4C3C7" strokeWidth="1.2" width="36" height="36">
                      <path d="M4 6h16M4 12h16M4 18h10" />
                    </svg>
                  )}
                </div>
                <div style={{ padding: 22 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gold)", marginBottom: 10 }}>
                    {new Date(post.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <h2 style={{ fontSize: 18, marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h2>
                  <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
        &copy; 2026 Satin & Seal, Nairobi. 18+ only.
      </footer>
    </div>
  );
}
