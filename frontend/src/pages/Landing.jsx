import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import { useDelivery } from "../context/DeliveryContext";

export default function Landing() {
  const [posts, setPosts] = useState([]);
  const { nairobi_fee, outside_fee } = useDelivery();

  useEffect(() => {
    api.getBlogPosts().then((data) => setPosts(data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />

      {/* HERO */}
      <section style={{ paddingTop: 110, paddingBottom: 90, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 700px 500px at 78% 10%, rgba(201,167,104,0.10), transparent 60%), radial-gradient(ellipse 600px 500px at 10% 90%, rgba(201,138,147,0.10), transparent 60%)"
        }} />
        <div className="wrap" style={{ position: "relative" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>
            Discreet Delivery, Nairobi &amp; Beyond
          </div>
          <h1 style={{ fontSize: "clamp(32px,5vw,58px)", marginBottom: 20, maxWidth: 760, marginLeft: "auto", marginRight: "auto", lineHeight: 1.1 }}>
            Pleasure, delivered <em style={{ fontStyle: "italic", color: "var(--rose-soft)" }}>quietly</em>, to your door.
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto 36px", fontSize: 16 }}>
            Curated intimacy essentials for the modern Kenyan. Plain packaging, no labels, no awkward questions.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/shop" className="btn btn-primary">Browse the Shop</Link>
            <a href="#journal" className="btn btn-ghost">Read the Journal</a>
          </div>
        </div>
      </section>

      {/* DELIVERY STRIP */}
      <div style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "22px 0" }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", fontSize: 14, color: "var(--muted)" }}>
          <div>Within Nairobi <b style={{ color: "var(--gold)", fontFamily: "Fraunces, serif" }}>KSh {nairobi_fee.toLocaleString()}</b></div>
          <div>Outside Nairobi <b style={{ color: "var(--gold)", fontFamily: "Fraunces, serif" }}>KSh {outside_fee.toLocaleString()}</b></div>
          <div>Delivered in <b>1–3 business days</b></div>
        </div>
      </div>

      {/* SHOP BY CATEGORY */}
      <section className="wrap" style={{ paddingTop: 70, paddingBottom: 70 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(24px,3vw,32px)", marginBottom: 10 }}>Shop by Category</h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Find exactly what you're looking for.</p>
        </div>
        <div className="grid-5">
          {[
            { name: "Massagers", slug: "massagers", icon: "M12 21c-4-2.6-8-6-8-10.4A4.6 4.6 0 0112 6a4.6 4.6 0 018 4.6C20 15 16 18.4 12 21z" },
            { name: "Couples", slug: "couples", icon: "M7 12a5 5 0 0110 0v3a5 5 0 01-10 0z" },
            { name: "Lubricants", slug: "lubricants", icon: "M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" },
            { name: "Wellness", slug: "wellness", icon: "M12 8v8M8 12h8" },
            { name: "Accessories", slug: "accessories", icon: "M5 7h14v11H5zM9 7V5a3 3 0 016 0v2" },
          ].map((cat) => (
            <Link key={cat.slug} to={`/shop?category=${cat.slug}`} style={{
              background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "28px 16px",
              textAlign: "center", transition: "border-color .2s"
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.3" width="30" height="30" style={{ margin: "0 auto 14px" }}>
                <path d={cat.icon} />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY SHOP WITH US */}
      <section style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "70px 0" }}>
        <div className="wrap grid-3-feature">
          <WhyItem eyebrow="Discretion" title="Nobody has to know" text="Plain boxes, no logos, and a generic sender name on every parcel — from checkout to your doorstep." />
          <WhyItem eyebrow="Speed" title="Fast, reliable delivery" text={`KSh ${nairobi_fee.toLocaleString()} flat within Nairobi, KSh ${outside_fee.toLocaleString()} countrywide. Most orders arrive within 1–3 business days.`} />
          <WhyItem eyebrow="Trust" title="Quality you can verify" text="Every product is body-safe certified, with clear materials and care info on each listing." />
        </div>
      </section>

      {/* JOURNAL / BLOG */}
      {posts.length > 0 && (
        <section id="journal" className="wrap" style={{ paddingTop: 70, paddingBottom: 70 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "clamp(24px,3vw,32px)", marginBottom: 8 }}>From the Journal</h2>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Honest, practical reading on intimacy and connection.</p>
            </div>
            <Link to="/journal" style={{ fontSize: 13, color: "var(--gold)", whiteSpace: "nowrap" }}>View all posts →</Link>
          </div>
          <div className="grid-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/journal/${post.slug}`} style={{
                background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden",
                display: "block", transition: "transform .2s, border-color .2s"
              }}>
                <div style={{ height: 140, background: "linear-gradient(155deg,#3a2540,#241a2a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#E4C3C7" strokeWidth="1.2" width="34" height="34">
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gold)", marginBottom: 10 }}>
                    {new Date(post.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <h3 style={{ fontSize: 17, marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section style={{ textAlign: "center", padding: "80px 0" }}>
        <div className="wrap">
          <h2 style={{ fontSize: "clamp(24px,3.4vw,36px)", marginBottom: 14 }}>Ready to explore?</h2>
          <p style={{ color: "var(--muted)", marginBottom: 30 }}>Browse the full collection — everything ships plain, fast, and discreet.</p>
          <Link to="/shop" className="btn btn-primary">Browse the Shop</Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "36px 0", textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
        &copy; 2026 Satin &amp; Seal, Nairobi. 18+ only.
      </footer>
    </div>
  );
}

function WhyItem({ eyebrow, title, text }) {
  return (
    <div>
      <div style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", color: "var(--rose-soft)", fontSize: 14, marginBottom: 14 }}>{eyebrow}</div>
      <h3 style={{ fontSize: 19, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
