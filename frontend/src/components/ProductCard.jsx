import { Link } from "react-router-dom";

export default function ProductCard({ product, onAdd, badge, saved, onToggleSave }) {
  return (
    <div className="p-card">
      <Link to={`/product/${product.id}`} className="p-media" style={{ background: product.image_url ? undefined : "linear-gradient(155deg,#3a2540,#241a2a)" }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="#E4C3C7" strokeWidth="1.3" width="48" height="48">
            <path d="M12 21c-4-2.6-8-6-8-10.4A4.6 4.6 0 0112 6a4.6 4.6 0 018 4.6C20 15 16 18.4 12 21z" />
          </svg>
        )}
        {badge && <span className="p-badge">{badge}</span>}
        {product.stock_status === "low_stock" && !badge && (
          <span className="p-badge p-badge-low">Only {product.quantity} left</span>
        )}
        {onToggleSave && (
          <button
            className="p-save"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(product); }}
            title={saved ? "Remove from wishlist" : "Save to wishlist"}
          >
            <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" width="14" height="14">
              <path d="M12 21c-4-2.6-8-6-8-10.4A4.6 4.6 0 0112 6a4.6 4.6 0 018 4.6C20 15 16 18.4 12 21z" />
            </svg>
          </button>
        )}
      </Link>
      <div className="p-body">
        <div className="p-cat">{product.category?.name || "Uncategorized"}</div>
        <Link to={`/product/${product.id}`} className="p-title" style={{ display: "block" }}>{product.name}</Link>
        {product.average_rating && (
          <div style={{ fontSize: 11.5, color: "var(--gold)", marginBottom: 8 }}>
            ★ {product.average_rating} <span style={{ color: "var(--muted)" }}>({product.review_count})</span>
          </div>
        )}
        <div className="p-foot">
          <div className="p-price">KSh {product.price.toLocaleString()}</div>
          <button className="p-add" onClick={() => onAdd(product)} title="Add to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .p-card{ background:var(--card); border:1px solid var(--line); border-radius:2px; overflow:hidden; transition:transform .25s, border-color .25s; position:relative; }
        .p-card:hover{ transform:translateY(-4px); border-color:rgba(201,167,104,0.35); }
        .p-media{ height:180px; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .p-badge{ position:absolute; top:12px; left:12px; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; padding:5px 10px; border-radius:999px; background:rgba(32,23,32,0.75); color:var(--gold); border:1px solid rgba(201,167,104,0.35); }
        .p-badge-low{ color:var(--rose-soft); border-color:rgba(201,138,147,0.4); }
        .p-save{ position:absolute; top:10px; right:10px; width:30px; height:30px; border-radius:50%; background:rgba(32,23,32,0.7); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--rose-soft); transition:all .15s; }
        .p-save:hover{ border-color:var(--rose); }
        .p-body{ padding:16px 16px 18px; }
        .p-cat{ font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-bottom:5px; }
        .p-title{ font-family:'Fraunces', serif; font-size:16px; margin-bottom:8px; }
        .p-foot{ display:flex; align-items:center; justify-content:space-between; }
        .p-price{ font-family:'Fraunces', serif; font-size:16px; color:var(--gold); }
        .p-add{ width:34px; height:34px; border-radius:50%; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; background:transparent; color:var(--cream); }
        .p-add:hover{ background:var(--rose); border-color:var(--rose); color:#241522; }
      `}</style>
    </div>
  );
}
