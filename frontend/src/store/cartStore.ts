import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl: string | null;
  personalizacion: number[];
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productoId: number) => void;
  updateCantidad: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  costoEnvio: () => number;
  total: () => number;
};

const sameCartItem = (left: CartItem, right: CartItem) =>
  left.productoId === right.productoId &&
  JSON.stringify(left.personalizacion) === JSON.stringify(right.personalizacion);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((current) => sameCartItem(current, item));
          if (!existing) {
            return { items: [...state.items, item] };
          }

          return {
            items: state.items.map((current) =>
              sameCartItem(current, item)
                ? { ...current, cantidad: current.cantidad + item.cantidad }
                : current,
            ),
          };
        }),
      removeItem: (productoId) =>
        set((state) => ({ items: state.items.filter((item) => item.productoId !== productoId) })),
      updateCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items
            .map((item) => (item.productoId === productoId ? { ...item, cantidad } : item))
            .filter((item) => item.cantidad > 0),
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((total, item) => total + item.cantidad, 0),
      subtotal: () => get().items.reduce((total, item) => total + item.precio * item.cantidad, 0),
      costoEnvio: () => 50,
      total: () => get().subtotal() + get().costoEnvio(),
    }),
    {
      name: 'food-store-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
