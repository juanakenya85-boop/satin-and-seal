// -----------------------------------------------------------------------------
// API CONFIG
// -----------------------------------------------------------------------------

// Local development:
//   VITE_API_BASE is normally unset.
//   Vite proxy forwards /api -> http://localhost:5000
//
// Production:
//   Set VITE_API_BASE to your deployed Flask backend, for example:
//   https://your-backend.onrender.com
//
// IMPORTANT:
//   Do NOT add /api to VITE_API_BASE.
//   The code below adds /api automatically.

const API_ROOT = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const BASE_URL = `${API_ROOT}/api`;


// -----------------------------------------------------------------------------
// IMAGE URL HELPERS
// -----------------------------------------------------------------------------

/**
 * Converts an image path returned by the API into a usable frontend URL.
 *
 * New Cloudinary uploads return URLs such as:
 * https://res.cloudinary.com/...
 *
 * Those must be returned unchanged.
 *
 * Old locally stored images may still look like:
 * /uploads/product-1-example.jpg
 *
 * Those need the backend URL in production.
 */
export function resolveImageUrl(path) {
  if (!path) {
    return path;
  }

  // Cloudinary or any other absolute URL.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Protocol-relative URL.
  if (path.startsWith("//")) {
    return `https:${path}`;
  }

  // Local/backend relative upload path.
  if (path.startsWith("/")) {
    return `${API_ROOT}${path}`;
  }

  // Handle paths without a leading slash.
  return `${API_ROOT}/${path}`;
}


// -----------------------------------------------------------------------------
// AUTH
// -----------------------------------------------------------------------------

export function getToken() {
  return localStorage.getItem("ss_token");
}


// -----------------------------------------------------------------------------
// JSON REQUEST HELPER
// -----------------------------------------------------------------------------

async function request(
  path,
  {
    method = "GET",
    body,
    auth = false,
  } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Something went wrong. Please try again."
    );
  }

  return data;
}


// -----------------------------------------------------------------------------
// FILE UPLOAD HELPER
// -----------------------------------------------------------------------------

/**
 * Uploads a file using multipart/form-data.
 *
 * IMPORTANT:
 * We deliberately DO NOT set Content-Type here.
 *
 * The browser automatically sets:
 *
 * multipart/form-data; boundary=...
 *
 * Setting Content-Type manually would break the upload.
 */
async function uploadFile(
  path,
  file,
  fieldName = "image"
) {
  if (!file) {
    throw new Error("Please select a file.");
  }

  const token = getToken();

  const formData = new FormData();
  formData.append(fieldName, file);

  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Upload failed. Please try again."
    );
  }

  return data;
}


// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

export const api = {

  // ===========================================================================
  // AUTH
  // ===========================================================================

  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: payload,
    }),

  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: payload,
    }),

  me: () =>
    request("/auth/me", {
      auth: true,
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token, password) =>
    request("/auth/reset-password", {
      method: "POST",
      body: {
        token,
        password,
      },
    }),


  // ===========================================================================
  // PRODUCTS
  // ===========================================================================

  getProducts: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      )
    );

    const qs = new URLSearchParams(cleanParams).toString();

    return request(
      `/products${qs ? `?${qs}` : ""}`
    );
  },

  getProduct: (id) =>
    request(`/products/${id}`),

  getCategories: () =>
    request("/products/categories"),

  createProduct: (payload) =>
    request("/products", {
      method: "POST",
      body: payload,
      auth: true,
    }),

  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  /**
   * Upload product image.
   *
   * Backend:
   * POST /api/products/<product_id>/image
   *
   * Backend uploads the file to Cloudinary and stores
   * the returned secure_url in product.image_url.
   */
  uploadProductImage: (id, file) =>
    uploadFile(
      `/products/${id}/image`,
      file,
      "image"
    ),


  // ===========================================================================
  // REVIEWS
  // ===========================================================================

  getReviews: (productId) =>
    request(`/products/${productId}/reviews`),

  submitReview: (productId, payload) =>
    request(`/products/${productId}/reviews`, {
      method: "POST",
      body: payload,
      auth: true,
    }),


  // ===========================================================================
  // WISHLIST
  // ===========================================================================

  getWishlist: () =>
    request("/products/wishlist", {
      auth: true,
    }),

  addToWishlist: (productId) =>
    request(`/products/${productId}/wishlist`, {
      method: "POST",
      auth: true,
    }),

  removeFromWishlist: (productId) =>
    request(`/products/${productId}/wishlist`, {
      method: "DELETE",
      auth: true,
    }),


  // ===========================================================================
  // DELIVERY
  // ===========================================================================

  getDeliveryRates: () =>
    request("/delivery-rates"),


  // ===========================================================================
  // CART
  // ===========================================================================

  getCart: () =>
    request("/cart", {
      auth: true,
    }),

  addToCart: (
    productId,
    quantity = 1
  ) =>
    request("/cart", {
      method: "POST",
      body: {
        product_id: productId,
        quantity,
      },
      auth: true,
    }),

  updateCartItem: (
    itemId,
    quantity
  ) =>
    request(`/cart/${itemId}`, {
      method: "PUT",
      body: {
        quantity,
      },
      auth: true,
    }),

  removeCartItem: (itemId) =>
    request(`/cart/${itemId}`, {
      method: "DELETE",
      auth: true,
    }),


  // ===========================================================================
  // ORDERS
  // ===========================================================================

  checkout: (payload) =>
    request("/orders/checkout", {
      method: "POST",
      body: payload,
      auth: true,
    }),

  getOrders: () =>
    request("/orders", {
      auth: true,
    }),

  getOrder: (id) =>
    request(`/orders/${id}`, {
      auth: true,
    }),


  // ===========================================================================
  // BLOG
  // ===========================================================================

  getBlogPosts: () =>
    request("/blog"),

  getBlogPost: (slug) =>
    request(`/blog/${slug}`),

  getAdminBlogPosts: () =>
    request("/blog/admin/all", {
      auth: true,
    }),

  createBlogPost: (payload) =>
    request("/blog", {
      method: "POST",
      body: payload,
      auth: true,
    }),

  updateBlogPost: (id, payload) =>
    request(`/blog/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),

  deleteBlogPost: (id) =>
    request(`/blog/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  uploadBlogCoverImage: (id, file) =>
    uploadFile(
      `/blog/${id}/cover-image`,
      file,
      "image"
    ),


  // ===========================================================================
  // ADMIN
  // ===========================================================================

  getAdminStats: () =>
    request("/admin/stats", {
      auth: true,
    }),

  getAdminOrders: () =>
    request("/admin/orders", {
      auth: true,
    }),

  updateOrderStatus: (
    orderId,
    status
  ) =>
    request(`/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: { status },
      auth: true,
    }),

  getNotifications: () =>
    request("/admin/notifications", {
      auth: true,
    }),

  markNotificationRead: (id) =>
    request(`/admin/notifications/${id}/read`, {
      method: "PUT",
      auth: true,
    }),

  markAllNotificationsRead: () =>
    request("/admin/notifications/read-all", {
      method: "PUT",
      auth: true,
    }),

  getAdminReviews: (
    status = "pending"
  ) =>
    request(
      `/admin/reviews?status=${encodeURIComponent(status)}`,
      {
        auth: true,
      }
    ),

  moderateReview: (
    id,
    status
  ) =>
    request(`/admin/reviews/${id}`, {
      method: "PUT",
      body: { status },
      auth: true,
    }),

  getSasaPaySettings: () =>
    request("/admin/settings/sasapay", {
      auth: true,
    }),

  updateSasaPaySettings: (payload) =>
    request("/admin/settings/sasapay", {
      method: "PUT",
      body: payload,
      auth: true,
    }),

  getDeliverySettings: () =>
    request("/admin/settings/delivery", {
      auth: true,
    }),

  updateDeliverySettings: (payload) =>
    request("/admin/settings/delivery", {
      method: "PUT",
      body: payload,
      auth: true,
    }),

  getRiders: () =>
    request("/admin/riders", {
      auth: true,
    }),

  createRider: (payload) =>
    request("/admin/riders", {
      method: "POST",
      body: payload,
      auth: true,
    }),

  deleteRider: (id) =>
    request(`/admin/riders/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  assignRider: (
    orderId,
    riderId
  ) =>
    request(`/orders/${orderId}/assign-rider`, {
      method: "PUT",
      body: {
        rider_id: riderId,
      },
      auth: true,
    }),


  // ===========================================================================
  // RIDER
  // ===========================================================================

  getMyDeliveries: () =>
    request("/rider/orders", {
      auth: true,
    }),

  updateDeliveryStatus: (
    orderId,
    status
  ) =>
    request(`/rider/orders/${orderId}/status`, {
      method: "PUT",
      body: { status },
      auth: true,
    }),
};


// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------

export { API_ROOT, BASE_URL };