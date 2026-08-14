// In local dev, VITE_API_BASE is unset, so this stays "/api" and Vite's dev
// proxy (vite.config.js) forwards it to localhost:5000. In production, set
// VITE_API_BASE to your deployed backend's full URL (e.g. Render's URL) —
// see the deployment README section.
const API_ROOT = import.meta.env.VITE_API_BASE || "";
const BASE_URL = `${API_ROOT}/api`;

// Uploaded product/blog photos are served from the backend at /uploads/...
// image_url values from the API are already relative paths like
// "/uploads/product-3-abc123.png" — this turns them into a full URL that
// actually resolves once the frontend and backend aren't on the same host.
// Product/blog images now come back as full Cloudinary URLs (e.g.
// "https://res.cloudinary.com/..."), which need no changes. Any older
// records still pointing at the old "/uploads/..." local-disk path (from
// before the Cloudinary migration) get prefixed with the API host so they
// at least resolve to *something* — though those specific files no longer
// exist on Render's ephemeral disk and will 404 until re-uploaded.
export function resolveImageUrl(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ROOT}${path}`;
}

function getToken() {
  return localStorage.getItem("ss_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

async function uploadFile(path, file, fieldName = "image") {
  const token = getToken();
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Upload failed. Please try again.");
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me", { auth: true }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, password) => request("/auth/reset-password", { method: "POST", body: { token, password } }),

  // products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  getCategories: () => request("/products/categories"),
  createProduct: (payload) => request("/products", { method: "POST", body: payload, auth: true }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE", auth: true }),
  uploadProductImage: (id, file) => uploadFile(`/products/${id}/image`, file),

  // reviews
  getReviews: (productId) => request(`/products/${productId}/reviews`),
  submitReview: (productId, payload) =>
    request(`/products/${productId}/reviews`, { method: "POST", body: payload, auth: true }),

  // wishlist
  getWishlist: () => request("/products/wishlist", { auth: true }),
  addToWishlist: (productId) => request(`/products/${productId}/wishlist`, { method: "POST", auth: true }),
  removeFromWishlist: (productId) => request(`/products/${productId}/wishlist`, { method: "DELETE", auth: true }),

  // delivery rates
  getDeliveryRates: () => request("/delivery-rates"),

  // cart
  getCart: () => request("/cart", { auth: true }),
  addToCart: (productId, quantity = 1) =>
    request("/cart", { method: "POST", body: { product_id: productId, quantity }, auth: true }),
  updateCartItem: (itemId, quantity) =>
    request(`/cart/${itemId}`, { method: "PUT", body: { quantity }, auth: true }),
  removeCartItem: (itemId) => request(`/cart/${itemId}`, { method: "DELETE", auth: true }),

  // orders
  checkout: (payload) => request("/orders/checkout", { method: "POST", body: payload, auth: true }),
  getOrders: () => request("/orders", { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),

  // blog
  getBlogPosts: () => request("/blog"),
  getBlogPost: (slug) => request(`/blog/${slug}`),
  getAdminBlogPosts: () => request("/blog/admin/all", { auth: true }),
  createBlogPost: (payload) => request("/blog", { method: "POST", body: payload, auth: true }),
  updateBlogPost: (id, payload) => request(`/blog/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteBlogPost: (id) => request(`/blog/${id}`, { method: "DELETE", auth: true }),
  uploadBlogCoverImage: (id, file) => uploadFile(`/blog/${id}/cover-image`, file),

  // admin
  getAdminStats: () => request("/admin/stats", { auth: true }),
  getAdminOrders: () => request("/admin/orders", { auth: true }),
  updateOrderStatus: (orderId, status) =>
    request(`/admin/orders/${orderId}/status`, { method: "PUT", body: { status }, auth: true }),
  getNotifications: () => request("/admin/notifications", { auth: true }),
  markNotificationRead: (id) => request(`/admin/notifications/${id}/read`, { method: "PUT", auth: true }),
  markAllNotificationsRead: () => request("/admin/notifications/read-all", { method: "PUT", auth: true }),
  getAdminReviews: (status = "pending") => request(`/admin/reviews?status=${status}`, { auth: true }),
  moderateReview: (id, status) =>
    request(`/admin/reviews/${id}`, { method: "PUT", body: { status }, auth: true }),
  getSasaPaySettings: () => request("/admin/settings/sasapay", { auth: true }),
  updateSasaPaySettings: (payload) =>
    request("/admin/settings/sasapay", { method: "PUT", body: payload, auth: true }),
  getDeliverySettings: () => request("/admin/settings/delivery", { auth: true }),
  updateDeliverySettings: (payload) =>
    request("/admin/settings/delivery", { method: "PUT", body: payload, auth: true }),
  getRiders: () => request("/admin/riders", { auth: true }),
  createRider: (payload) => request("/admin/riders", { method: "POST", body: payload, auth: true }),
  deleteRider: (id) => request(`/admin/riders/${id}`, { method: "DELETE", auth: true }),
  assignRider: (orderId, riderId) =>
    request(`/orders/${orderId}/assign-rider`, { method: "PUT", body: { rider_id: riderId }, auth: true }),

  // rider
  getMyDeliveries: () => request("/rider/orders", { auth: true }),
  updateDeliveryStatus: (orderId, status) =>
    request(`/rider/orders/${orderId}/status`, { method: "PUT", body: { status }, auth: true }),
};

export { getToken };
