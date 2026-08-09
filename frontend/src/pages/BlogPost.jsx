import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getBlogPost(slug)
      .then(setPost)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <Navbar />
        <div className="wrap" style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center" }}>
          <p className="error-banner" style={{ display: "inline-block" }}>{error || "Post not found."}</p>
          <div style={{ marginTop: 16 }}><Link to="/" style={{ color: "var(--gold)" }}>← Back home</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="wrap" style={{ maxWidth: 720, paddingTop: 50, paddingBottom: 90 }}>
        <Link to="/journal" style={{ fontSize: 13, color: "var(--muted)" }}>← Back to Journal</Link>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gold)", margin: "24px 0 14px" }}>
          {new Date(post.published_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} &middot; {post.author}
        </div>
        <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginBottom: 28, lineHeight: 1.2 }}>{post.title}</h1>

        <div style={{ fontSize: 15.5, lineHeight: 1.8, color: "var(--cream)" }}>
          {post.content.split("\n\n").map((para, i) => (
            <p key={i} style={{ marginBottom: 22 }} dangerouslySetInnerHTML={{ __html: formatParagraph(para) }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatParagraph(text) {
  // Simple **bold** markdown support for the seeded post
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
