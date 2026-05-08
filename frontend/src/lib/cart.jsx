import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);
const KEY = "saksham_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (worksheet) => {
    setItems((prev) => {
      if (prev.find((i) => i.worksheet_id === worksheet.worksheet_id)) return prev;
      return [...prev, {
        worksheet_id: worksheet.worksheet_id,
        title: worksheet.title,
        price: worksheet.price,
        subject: worksheet.subject,
        level: worksheet.level,
        grade: worksheet.grade,
        cover_image: worksheet.cover_image,
        quantity: 1,
      }];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((i) => i.worksheet_id !== id));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + Number(i.price || 0) * (i.quantity || 1), 0);
  const has = (id) => !!items.find((i) => i.worksheet_id === id);

  return (
    <CartCtx.Provider value={{ items, add, remove, clear, total, has }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
