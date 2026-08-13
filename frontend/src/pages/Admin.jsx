import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import { resolveImageUrl } from "../api/client";

const emptyForm = { name: "", category_id: "", description: "", price: "", quantity: "", is_new: false };
const emptyBlogForm = { title: "", excerpt: "", content: "", author: "Satin & Seal Team", is_published: true };

export default function Admin() {
  const [tab, setTab] = useState("products"); // 'products' | 'orders' | 'reviews' | 'blog'
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const [blogPosts, setBlogPosts] = useState([]);
  const [blogForm, setBlogForm] = useState(emptyBlogForm);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogCoverFile, setBlogCoverFile] = useState(null);
  const [blogCoverPreview, setBlogCoverPreview] = useState(null);
  const blogFileInputRef = useRef(null);

  const [sasapayForm, setSasapayForm] = useState({
    sasapay_client_id: "", sasapay_client_secret: "", sasapay_merchant_code: "",
    sasapay_network_code: "63902", is_enabled: false,
  });
  const [sasapayStatus, setSasapayStatus] = useState(null); // { is_configured, is_enabled, last_verified_at }
  const [sasapaySaving, setSasapaySaving] = useState(false);
  const [sasapayMessage, setSasapayMessage] = useState("");
  const [sasapayError, setSasapayError] = useState("");

  const [riders, setRiders] = useState([]);
  const [riderForm, setRiderForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [riderError, setRiderError] = useState("");
  const [riderMessage, setRiderMessage] = useState("");

  const [deliveryForm, setDeliveryForm] = useState({ nairobi_fee: "300", outside_fee: "700" });
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryError, setDeliveryError] = useState("");

  function loadAll() {
    api.getAdminStats().then(setStats).catch((e) => setError(e.message));
    api.getProducts({}).then(setProducts).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
    api.getAdminOrders().then(setOrders).catch(() => {});
    api.getAdminReviews("pending").then(setPendingReviews).catch(() => {});
    api.getAdminBlogPosts().then(setBlogPosts).catch(() => {});
    api.getSasaPaySettings().then((s) => {
      setSasapayStatus(s);
      setSasapayForm({
        sasapay_client_id: s.sasapay_client_id || "",
        sasapay_client_secret: s.sasapay_client_secret || "",
        sasapay_merchant_code: s.sasapay_merchant_code || "",
        sasapay_network_code: s.sasapay_network_code || "63902",
        is_enabled: s.is_enabled,
      });
    }).catch(() => {});
    api.getRiders().then(setRiders).catch(() => {});
    api.getDeliverySettings().then((s) => {
      setDeliveryForm({ nairobi_fee: String(s.nairobi_fee), outside_fee: String(s.outside_fee) });
    }).catch(() => {});
    api.getNotifications().then((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    }).catch(() => {});
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 20000); // poll every 20s for new notifications
    return () => clearInterval(interval);
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category_id: product.category?.id || "",
      description: product.description || "",
      price: product.price,
      quantity: product.quantity,
      is_new: product.is_new,
    });
    setImagePreview(product.image_url ? resolveImageUrl(product.image_url) : null);
    setImageFile(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity) || 0,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    };
    try {
      let productId = editingId;
      if (editingId) {
        await api.updateProduct(editingId, payload);
        setMessage("Product updated.");
      } else {
        const created = await api.createProduct(payload);
        productId = created.id;
        setMessage("Product published.");
      }
      if (imageFile && productId) {
        await api.uploadProductImage(productId, imageFile);
      }
      resetForm();
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleModerateReview(reviewId, status) {
    try {
      await api.moderateReview(reviewId, status);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function setBlogField(field, value) {
    setBlogForm((f) => ({ ...f, [field]: value }));
  }

  function startEditBlog(post) {
    setEditingBlogId(post.id);
    setBlogForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      is_published: post.is_published,
    });
    setBlogCoverPreview(post.cover_image_url ? resolveImageUrl(post.cover_image_url) : null);
    setBlogCoverFile(null);
  }

  function resetBlogForm() {
    setEditingBlogId(null);
    setBlogForm(emptyBlogForm);
    setBlogCoverFile(null);
    setBlogCoverPreview(null);
    if (blogFileInputRef.current) blogFileInputRef.current.value = "";
  }

  function handleBlogCoverSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBlogCoverFile(file);
    setBlogCoverPreview(URL.createObjectURL(file));
  }

  async function handleBlogSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      let postId = editingBlogId;
      if (editingBlogId) {
        await api.updateBlogPost(editingBlogId, blogForm);
        setMessage("Post updated.");
      } else {
        const created = await api.createBlogPost(blogForm);
        postId = created.id;
        setMessage("Post published.");
      }
      if (blogCoverFile && postId) {
        await api.uploadBlogCoverImage(postId, blogCoverFile);
      }
      resetBlogForm();
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteBlog(id) {
    if (!confirm("Delete this post?")) return;
    try {
      await api.deleteBlogPost(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function setSasapayField(field, value) {
    setSasapayForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSasapaySubmit(e) {
    e.preventDefault();
    setSasapayMessage("");
    setSasapayError("");
    setSasapaySaving(true);
    try {
      const res = await api.updateSasaPaySettings(sasapayForm);
      setSasapayMessage(res.message);
      setSasapayStatus(res.settings);
      setSasapayForm((f) => ({ ...f, sasapay_client_secret: res.settings.sasapay_client_secret || "" }));
    } catch (err) {
      setSasapayError(err.message);
    } finally {
      setSasapaySaving(false);
    }
  }

  function setRiderField(field, value) {
    setRiderForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreateRider(e) {
    e.preventDefault();
    setRiderError("");
    setRiderMessage("");
    try {
      await api.createRider(riderForm);
      setRiderMessage(`${riderForm.name} added as a rider.`);
      setRiderForm({ name: "", email: "", phone: "", password: "" });
      loadAll();
    } catch (err) {
      setRiderError(err.message);
    }
  }

  async function handleDeleteRider(id) {
    if (!confirm("Remove this rider? Any orders assigned to them will be unassigned.")) return;
    try {
      await api.deleteRider(id);
      loadAll();
    } catch (err) {
      setRiderError(err.message);
    }
  }

  async function handleAssignRider(orderId, riderId) {
    try {
      await api.assignRider(orderId, riderId || null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeliverySubmit(e) {
    e.preventDefault();
    setDeliveryMessage("");
    setDeliveryError("");
    setDeliverySaving(true);
    try {
      const res = await api.updateDeliverySettings({
        nairobi_fee: parseFloat(deliveryForm.nairobi_fee),
        outside_fee: parseFloat(deliveryForm.outside_fee),
      });
      setDeliveryMessage(res.message);
    } catch (err) {
      setDeliveryError(err.message);
    } finally {
      setDeliverySaving(false);
    }
  }

  async function handleOpenNotifications() {
    setShowNotifications((s) => !s);
    if (!showNotifications && unreadCount > 0) {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
    }
  }

  return (
    <div>
      <Navbar active="admin" />

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: 26, marginBottom: 6 }}>Admin Dashboard</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Manage your catalog, orders, and reviews. Items with 0 quantity are hidden from the shop automatically.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={handleOpenNotifications} style={{
              width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--line-strong)",
              background: "var(--card)", cursor: "pointer", position: "relative", display: "flex",
              alignItems: "center", justifyContent: "center"
            }} title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
                <path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" />
                <path d="M10 20a2 2 0 004 0" />
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4, background: "var(--bad)", color: "#241522",
                  fontSize: 10, fontWeight: 700, width: 17, height: 17, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: "absolute", right: 0, top: 48, width: "min(340px, 88vw)", maxHeight: 400, overflowY: "auto",
                background: "var(--card)", border: "1px solid var(--line-strong)", borderRadius: 8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 100
              }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", fontSize: 13, fontWeight: 600 }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 20, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>No notifications yet.</div>
                ) : notifications.map((n) => (
                  <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", fontSize: 12.5 }}>
                    <div style={{ color: "var(--cream)", marginBottom: 4 }}>{n.message}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {message && <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "12px 16px", borderRadius: 2, fontSize: 13, marginBottom: 16 }}>{message}</div>}

        {stats && (
          <>
            <div className="grid-stats" style={{ marginBottom: 16 }}>
              <StatCard label="Total income" value={`KSh ${stats.total_income.toLocaleString()}`} color="var(--gold)" />
              <StatCard label="Total orders" value={stats.total_orders} />
              <StatCard label="Total customers" value={stats.total_customers} />
              <StatCard label="Pending reviews" value={stats.pending_reviews} color={stats.pending_reviews > 0 ? "var(--warn)" : undefined} />
            </div>
            <div className="grid-stats" style={{ marginBottom: 28 }}>
              <StatCard label="Total products" value={stats.total_products} />
              <StatCard label="Low stock" value={stats.low_stock} color="var(--warn)" />
              <StatCard label="Out of stock" value={stats.out_of_stock} color="var(--bad)" />
              <StatCard label="Riders" value={stats.riders_active} />
            </div>

            <div className="grid-2-stack" style={{ marginBottom: 28 }}>
              <BreakdownCard title="Products by category" rows={stats.category_breakdown.map(c => ({ label: c.name, value: c.product_count }))} />
              <BreakdownCard title="Payment methods" rows={stats.payment_breakdown.map(p => ({ label: paymentLabel(p.method), value: `${p.count} · KSh ${p.total.toLocaleString()}` }))} />
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          <TabButton label="Products" active={tab === "products"} onClick={() => setTab("products")} />
          <TabButton label={`Orders (${orders.length})`} active={tab === "orders"} onClick={() => setTab("orders")} />
          <TabButton label={`Reviews (${pendingReviews.length})`} active={tab === "reviews"} onClick={() => setTab("reviews")} />
          <TabButton label={`Blog (${blogPosts.length})`} active={tab === "blog"} onClick={() => setTab("blog")} />
          <TabButton label={`Riders (${riders.length})`} active={tab === "riders"} onClick={() => setTab("riders")} />
          <TabButton label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
        </div>

        {tab === "orders" && (
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Order", "Customer", "Items", "Total", "Delivery", "Payment", "Rider", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)", padding: "12px 20px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No orders yet.</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>#{o.id}</td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                      <div>{o.address.full_name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{o.address.city}</div>
                    </td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>{o.items.length}</td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 13.5, color: "var(--gold)" }}>KSh {o.total.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 12.5, color: "var(--muted)" }}>
                      {o.delivery_location === "nairobi" ? "Nairobi" : "Outside Nairobi"}
                    </td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                      <PaymentStatusBadge status={o.payment_status} method={o.payment_method} />
                    </td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                      <select
                        value={o.assigned_rider?.id || ""}
                        onChange={(e) => handleAssignRider(o.id, e.target.value ? parseInt(e.target.value) : null)}
                        style={{ background: "var(--bg-alt)", border: "1px solid var(--line-strong)", color: "var(--cream)", padding: "6px 10px", borderRadius: 2, fontSize: 12.5 }}
                      >
                        <option value="">Unassigned</option>
                        {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        style={{ background: "var(--bg-alt)", border: "1px solid var(--line-strong)", color: "var(--cream)", padding: "6px 10px", borderRadius: 2, fontSize: 12.5 }}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="out_for_delivery">Out for delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="delivery_failed">Delivery failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pendingReviews.length === 0 ? (
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 30, textAlign: "center", color: "var(--muted)" }}>
                No reviews awaiting moderation.
              </div>
            ) : pendingReviews.map((r) => (
              <div key={r.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.reviewer_name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>on {r.product_name}</div>
                  </div>
                  <div style={{ color: "var(--gold)" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                </div>
                {r.comment && <p style={{ fontSize: 13.5, color: "var(--cream)", marginBottom: 14 }}>{r.comment}</p>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => handleModerateReview(r.id, "approved")} className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 11.5 }}>Approve</button>
                  <button onClick={() => handleModerateReview(r.id, "rejected")} className="btn btn-ghost" style={{ padding: "7px 16px", fontSize: 11.5 }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "products" && (
          <div className="layout-sidebar">

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Product", "Price", "Qty", "Status", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)", padding: "12px 20px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No products yet — add your first one on the right.</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--bg-alt)" }}>
                            {p.image_url && <img src={resolveImageUrl(p.image_url)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{p.category?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>KSh {p.price.toLocaleString()}</td>
                      <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 13.5, color: p.quantity === 0 ? "var(--bad)" : p.quantity < 5 ? "var(--warn)" : "var(--cream)", fontWeight: p.quantity < 5 ? 700 : 400 }}>{p.quantity}</td>
                      <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}><StockPill status={p.stock_status} /></td>
                      <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => startEdit(p)} className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 11 }}>Edit</button>
                          <button onClick={() => handleDelete(p.id)} className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 11 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 22 }}>
              <h2 style={{ fontSize: 17, marginBottom: 18 }}>{editingId ? "Edit product" : "Add product"}</h2>
              <form onSubmit={handleSubmit}>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "1px dashed var(--line-strong)", borderRadius: 2, marginBottom: 16, cursor: "pointer",
                    overflow: "hidden", height: imagePreview ? 160 : "auto", padding: imagePreview ? 0 : 20,
                    textAlign: "center", color: "var(--muted)", fontSize: 12.5
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20" style={{ margin: "0 auto 8px" }}>
                        <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                      </svg>
                      <div>Click to upload a product photo</div>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} style={{ display: "none" }} />

                <div className="field"><label>Product name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
                <div className="field">
                  <label>Category</label>
                  <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
                <div className="field-row">
                  <div className="field"><label>Price (KSh)</label><input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} required /></div>
                  <div className="field"><label>Quantity</label><input type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} required /></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, fontSize: 13 }}>
                  <input type="checkbox" checked={form.is_new} onChange={(e) => set("is_new", e.target.checked)} />
                  Mark as new
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {editingId && <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={resetForm}>Cancel</button>}
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? "Save Changes" : "Publish Product"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {tab === "blog" && (
          <div className="layout-sidebar">

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {blogPosts.length === 0 ? (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 30, textAlign: "center", color: "var(--muted)" }}>
                  No posts yet — write your first one on the right.
                </div>
              ) : blogPosts.map((p) => (
                <div key={p.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--bg-alt)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.cover_image_url ? (
                      <img src={resolveImageUrl(p.cover_image_url)} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.3" width="20" height="20"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {new Date(p.published_at).toLocaleDateString()} &middot; {p.is_published ? <span style={{ color: "var(--good)" }}>Published</span> : <span style={{ color: "var(--warn)" }}>Draft</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => startEditBlog(p)} className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 11 }}>Edit</button>
                    <button onClick={() => handleDeleteBlog(p.id)} className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 11 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 22 }}>
              <h2 style={{ fontSize: 17, marginBottom: 18 }}>{editingBlogId ? "Edit post" : "Write a post"}</h2>
              <form onSubmit={handleBlogSubmit}>

                <div
                  onClick={() => blogFileInputRef.current?.click()}
                  style={{
                    border: "1px dashed var(--line-strong)", borderRadius: 2, marginBottom: 16, cursor: "pointer",
                    overflow: "hidden", height: blogCoverPreview ? 140 : "auto", padding: blogCoverPreview ? 0 : 20,
                    textAlign: "center", color: "var(--muted)", fontSize: 12.5
                  }}
                >
                  {blogCoverPreview ? (
                    <img src={blogCoverPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20" style={{ margin: "0 auto 8px" }}>
                        <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                      </svg>
                      <div>Click to upload a cover image</div>
                    </>
                  )}
                </div>
                <input ref={blogFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBlogCoverSelect} style={{ display: "none" }} />

                <div className="field"><label>Title</label><input value={blogForm.title} onChange={(e) => setBlogField("title", e.target.value)} required /></div>
                <div className="field"><label>Excerpt (shown on cards)</label><textarea value={blogForm.excerpt} onChange={(e) => setBlogField("excerpt", e.target.value)} style={{ minHeight: 50 }} required /></div>
                <div className="field"><label>Content</label><textarea value={blogForm.content} onChange={(e) => setBlogField("content", e.target.value)} style={{ minHeight: 160 }} placeholder="Separate paragraphs with a blank line. Use **text** for bold." required /></div>
                <div className="field"><label>Author</label><input value={blogForm.author} onChange={(e) => setBlogField("author", e.target.value)} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, fontSize: 13 }}>
                  <input type="checkbox" checked={blogForm.is_published} onChange={(e) => setBlogField("is_published", e.target.checked)} />
                  Publish immediately (uncheck to save as draft)
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {editingBlogId && <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={resetBlogForm}>Cancel</button>}
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingBlogId ? "Save Changes" : "Publish Post"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === "riders" && (
          <div className="layout-sidebar">

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {riders.length === 0 ? (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 30, textAlign: "center", color: "var(--muted)" }}>
                  No riders yet — add your first one on the right.
                </div>
              ) : riders.map((r) => (
                <div key={r.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                    {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.email} &middot; {r.phone || "No phone"}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: r.active_deliveries > 0 ? "var(--warn)" : "var(--muted)", flexShrink: 0, marginRight: 8 }}>
                    {r.active_deliveries} active
                  </div>
                  <button onClick={() => handleDeleteRider(r.id)} className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 11, flexShrink: 0 }}>Remove</button>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 22 }}>
              <h2 style={{ fontSize: 17, marginBottom: 6 }}>Add a rider</h2>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 18, lineHeight: 1.6 }}>
                Riders see only their assigned deliveries — never product names, prices, or your catalog.
              </p>
              {riderError && <div className="error-banner">{riderError}</div>}
              {riderMessage && (
                <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "12px 16px", borderRadius: 2, fontSize: 13, marginBottom: 16 }}>
                  {riderMessage}
                </div>
              )}
              <form onSubmit={handleCreateRider}>
                <div className="field"><label>Full name</label><input value={riderForm.name} onChange={(e) => setRiderField("name", e.target.value)} required /></div>
                <div className="field"><label>Email</label><input type="email" value={riderForm.email} onChange={(e) => setRiderField("email", e.target.value)} required /></div>
                <div className="field"><label>Phone</label><input value={riderForm.phone} onChange={(e) => setRiderField("phone", e.target.value)} placeholder="07•• ••• •••" /></div>
                <div className="field"><label>Temporary password</label><input type="password" value={riderForm.password} onChange={(e) => setRiderField("password", e.target.value)} placeholder="At least 8 characters" required /></div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Add Rider</button>
              </form>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 28, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, marginBottom: 6 }}>Delivery Rates</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>
                These fees show up everywhere on the site automatically — the landing page, cart, and checkout all read from here.
              </p>
              {deliveryError && <div className="error-banner">{deliveryError}</div>}
              {deliveryMessage && !deliveryError && (
                <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "12px 16px", borderRadius: 2, fontSize: 13, marginBottom: 16 }}>
                  {deliveryMessage}
                </div>
              )}
              <form onSubmit={handleDeliverySubmit}>
                <div className="field-row">
                  <div className="field">
                    <label>Within Nairobi (KSh)</label>
                    <input type="number" value={deliveryForm.nairobi_fee} onChange={(e) => setDeliveryForm((f) => ({ ...f, nairobi_fee: e.target.value }))} required />
                  </div>
                  <div className="field">
                    <label>Outside Nairobi (KSh)</label>
                    <input type="number" value={deliveryForm.outside_fee} onChange={(e) => setDeliveryForm((f) => ({ ...f, outside_fee: e.target.value }))} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={deliverySaving} style={{ width: "100%" }}>
                  {deliverySaving ? "Saving…" : "Save Delivery Rates"}
                </button>
              </form>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <h2 style={{ fontSize: 18 }}>Payments — SasaPay</h2>
                {sasapayStatus && (
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, padding: "5px 11px", borderRadius: 999,
                    background: sasapayStatus.is_enabled ? "var(--good-bg)" : "var(--bg-alt)",
                    color: sasapayStatus.is_enabled ? "var(--good)" : "var(--muted)",
                    border: sasapayStatus.is_enabled ? "1px solid rgba(143,174,124,0.3)" : "1px solid var(--line-strong)"
                  }}>
                    {sasapayStatus.is_enabled ? "Connected" : "Not connected"}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
                Enter your SasaPay sandbox or production credentials from{" "}
                <a href="https://docs.sasapay.app" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>docs.sasapay.app</a>.
                We test the connection before saving — if the credentials are wrong, nothing gets enabled.
              </p>

              {sasapayError && <div className="error-banner">{sasapayError}</div>}
              {sasapayMessage && !sasapayError && (
                <div style={{ background: "var(--good-bg)", color: "var(--good)", border: "1px solid rgba(143,174,124,0.3)", padding: "12px 16px", borderRadius: 2, fontSize: 13, marginBottom: 16 }}>
                  {sasapayMessage}
                </div>
              )}
              {sasapayStatus?.last_verified_at && (
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
                  Last verified: {new Date(sasapayStatus.last_verified_at).toLocaleString()}
                </p>
              )}

              <form onSubmit={handleSasapaySubmit}>
                <div className="field">
                  <label>Client ID</label>
                  <input value={sasapayForm.sasapay_client_id} onChange={(e) => setSasapayField("sasapay_client_id", e.target.value)} placeholder="From your SasaPay developer dashboard" />
                </div>
                <div className="field">
                  <label>Client Secret</label>
                  <input type="password" value={sasapayForm.sasapay_client_secret} onChange={(e) => setSasapayField("sasapay_client_secret", e.target.value)} placeholder="Kept masked once saved" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Merchant Code</label>
                    <input value={sasapayForm.sasapay_merchant_code} onChange={(e) => setSasapayField("sasapay_merchant_code", e.target.value)} placeholder="e.g. 600980" />
                  </div>
                  <div className="field">
                    <label>Network Code</label>
                    <select value={sasapayForm.sasapay_network_code} onChange={(e) => setSasapayField("sasapay_network_code", e.target.value)}>
                      <option value="63902">M-Pesa (63902)</option>
                      <option value="0">SasaPay Wallet (0)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "1px solid var(--line)", marginTop: 6, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Enable SasaPay checkout</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>When off, orders are saved but payment is arranged manually</div>
                  </div>
                  <label style={{ position: "relative", width: 38, height: 22, flexShrink: 0 }}>
                    <input type="checkbox" checked={sasapayForm.is_enabled} onChange={(e) => setSasapayField("is_enabled", e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: "absolute", inset: 0, background: sasapayForm.is_enabled ? "var(--rose)" : "var(--line-strong)",
                      borderRadius: 999, cursor: "pointer", transition: ".2s"
                    }}>
                      <span style={{
                        position: "absolute", width: 16, height: 16, left: sasapayForm.is_enabled ? 19 : 3, top: 3,
                        background: "var(--cream)", borderRadius: "50%", transition: ".2s"
                      }} />
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" disabled={sasapaySaving} style={{ width: "100%" }}>
                  {sasapaySaving ? "Testing connection…" : "Save & Test Connection"}
                </button>
              </form>
            </div>

            <div style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", borderRadius: 8, padding: 18, marginTop: 16, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
              <b style={{ color: "var(--cream)" }}>Card payments:</b> SasaPay is mobile-money only and doesn't process
              cards. The "Card" option at checkout is currently a placeholder — customers who pick it just have their
              order saved for manual follow-up, the same as when SasaPay isn't connected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function paymentLabel(method) {
  return { mpesa: "M-Pesa (SasaPay)", card: "Card", cod: "Cash on Delivery" }[method] || method;
}

function PaymentStatusBadge({ status, method }) {
  const map = {
    paid: { label: "Paid", color: "var(--good)", bg: "var(--good-bg)" },
    pending: { label: "Pending", color: "var(--warn)", bg: "var(--warn-bg)" },
    manual: { label: "Needs follow-up", color: "var(--warn)", bg: "var(--warn-bg)" },
    failed: { label: "Failed", color: "var(--bad)", bg: "var(--bad-bg)" },
  };
  const s = map[status] || map.pending;
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: s.bg, color: s.color }}>{s.label}</span>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>{paymentLabel(method)}</div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="btn" style={{
      background: active ? "var(--rose)" : "transparent",
      color: active ? "#241522" : "var(--cream)",
      borderColor: "var(--line-strong)",
      flexShrink: 0, whiteSpace: "nowrap"
    }}>{label}</button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: color || "var(--cream)" }}>{value}</div>
    </div>
  );
}

function BreakdownCard({ title, rows }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
      <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 14, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{title}</h3>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>No data yet.</div>
      ) : rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
          <span style={{ color: "var(--muted)" }}>{r.label}</span>
          <span>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function StockPill({ status }) {
  const map = {
    in_stock: { label: "Live", color: "var(--good)", bg: "var(--good-bg)" },
    low_stock: { label: "Low stock", color: "var(--warn)", bg: "var(--warn-bg)" },
    out_of_stock: { label: "Hidden — out of stock", color: "var(--bad)", bg: "var(--bad-bg)" },
  };
  const s = map[status] || map.in_stock;
  return <span style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 11px", borderRadius: 999, background: s.bg, color: s.color }}>{s.label}</span>;
}
