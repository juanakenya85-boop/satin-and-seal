import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const GUEST_CART_KEY = "ss_guest_cart";

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function guestItemsToDisplay(rawItems) {
  return rawItems.map((entry) => ({
    id: `g-${entry.product.id}`,
    product: entry.product,
    quantity: entry.quantity,
    line_total: entry.product.price * entry.quantity,
  }));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const wasLoggedIn = useRef(false);

  const refreshServerCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCart();
      setItems(data.items);
      setSubtotal(data.subtotal);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGuestCart = useCallback(() => {
    const raw = loadGuestCart();
    const display = guestItemsToDisplay(raw);
    setItems(display);
    setSubtotal(display.reduce((sum, i) => sum + i.line_total, 0));
  }, []);

  // On login, merge whatever was in the local guest cart into the real
  // server-side cart, then clear it — so nobody loses items they added
  // before deciding to sign in partway through shopping.
  useEffect(() => {
    async function handleAuthChange() {
      if (user && !wasLoggedIn.current) {
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
          for (const entry of guestItems) {
            try {
              await api.addToCart(entry.product.id, entry.quantity);
            } catch {
              // stock may have changed since it was added as a guest — skip silently
            }
          }
          saveGuestCart([]);
        }
        wasLoggedIn.current = true;
        await refreshServerCart();
      } else if (!user) {
        wasLoggedIn.current = false;
        refreshGuestCart();
      } else {
        await refreshServerCart();
      }
    }
    handleAuthChange();
  }, [user, refreshServerCart, refreshGuestCart]);

  async function addItem(product, quantity = 1) {
    if (user) {
      await api.addToCart(product.id, quantity);
      await refreshServerCart();
    } else {
      const current = loadGuestCart();
      const existing = current.find((e) => e.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        current.push({ product, quantity });
      }
      saveGuestCart(current);
      refreshGuestCart();
    }
  }

  async function updateItem(itemId, quantity) {
    if (typeof itemId === "string" && itemId.startsWith("g-")) {
      const productId = parseInt(itemId.slice(2), 10);
      let current = loadGuestCart();
      if (quantity <= 0) {
        current = current.filter((e) => e.product.id !== productId);
      } else {
        const existing = current.find((e) => e.product.id === productId);
        if (existing) existing.quantity = quantity;
      }
      saveGuestCart(current);
      refreshGuestCart();
    } else {
      await api.updateCartItem(itemId, quantity);
      await refreshServerCart();
    }
  }

  async function removeItem(itemId) {
    if (typeof itemId === "string" && itemId.startsWith("g-")) {
      const productId = parseInt(itemId.slice(2), 10);
      const current = loadGuestCart().filter((e) => e.product.id !== productId);
      saveGuestCart(current);
      refreshGuestCart();
    } else {
      await api.removeCartItem(itemId);
      await refreshServerCart();
    }
  }

  function clearGuestCart() {
    saveGuestCart([]);
    refreshGuestCart();
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, subtotal, count, loading, addItem, updateItem, removeItem,
      refresh: user ? refreshServerCart : refreshGuestCart,
      clearGuestCart, isGuest: !user,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
