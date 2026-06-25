import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product, GeoPoint } from "../types/models";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>;
  unitPrice: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  storeId: number | null;
  storeName: string | null;
  deliveryAddress: string;
  deliveryLocation: GeoPoint | null;
  deliveryNotes: string;
  addItem: (
    product: Product,
    quantity: number,
    selectedOptions: Record<string, string>,
  ) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setDeliveryAddress: (address: string) => void;
  setDeliveryLocation: (location: GeoPoint) => void;
  setDeliveryNotes: (notes: string) => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  hydrate: () => Promise<void>;
}

const CART_KEY = "kinetik_cart";

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeId: null,
  storeName: null,
  deliveryAddress: "",
  deliveryLocation: null,
  deliveryNotes: "",

  addItem: (product, quantity, selectedOptions) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id,
      );

      if (existingIndex >= 0) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          subtotal:
            (updated[existingIndex].quantity + quantity) *
            updated[existingIndex].unitPrice,
        };
        return { items: updated };
      }

      const unitPrice = Number(product.price);
      return {
        items: [
          ...state.items,
          {
            product,
            quantity,
            selectedOptions,
            unitPrice,
            subtotal: quantity * unitPrice,
          },
        ],
        storeId: product.store,
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity, subtotal: quantity * item.unitPrice }
          : item,
      ),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      storeId: null,
      storeName: null,
      deliveryAddress: "",
      deliveryLocation: null,
      deliveryNotes: "",
    });
  },

  setDeliveryAddress: (address) => set({ deliveryAddress: address }),
  setDeliveryLocation: (location) => set({ deliveryLocation: location }),
  setDeliveryNotes: (notes) => set({ deliveryNotes: notes }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set(parsed);
      }
    } catch {
      // ignore hydration errors
    }
  },
}));
