import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getCart();
      setItems(data.items);
      setSubtotal(data.subtotal);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function addItem(productId, quantity = 1) {
    await api.addToCart(productId, quantity);
    await refresh();
  }

  async function updateItem(itemId, quantity) {
    await api.updateCartItem(itemId, quantity);
    await refresh();
  }

  async function removeItem(itemId) {
    await api.removeCartItem(itemId);
    await refresh();
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, subtotal, count, loading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
