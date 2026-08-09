import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const DeliveryContext = createContext(null);

const FALLBACK = { nairobi_fee: 300, outside_fee: 700 };

export function DeliveryProvider({ children }) {
  const [rates, setRates] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDeliveryRates()
      .then(setRates)
      .catch(() => setRates(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DeliveryContext.Provider value={{ ...rates, loading }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  return useContext(DeliveryContext);
}
