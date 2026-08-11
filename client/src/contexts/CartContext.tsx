import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { api } from "../utils/api";
import { useAuth } from "./AuthContext";
import { Cart, AddToCartPayload } from "../types/cart";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItemToCart: (payload: AddToCartPayload) => Promise<void>;
  updateItemQuantity: (menuItemId: string, newQuantity: number) => Promise<void>;
  removeItemFromCart: (menuItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setIsLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    try {
      const response = await api.get<
        | Cart
        | {
            message: string;
            cart: {
              items: [];
              subtotal: number;
              discountAmount: number;
              grandTotal: number;
            };
          }
      >("/cart");
      const data = response.data;

      if (data && "_id" in data) {
        setCart(data);
      } else if (data && "cart" in data) {
        setCart(null);
      } else {
        setCart(null);
      }
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItemToCart = useCallback(
    async (payload: AddToCartPayload) => {
      try {
        await api.post("/cart", payload);
        await fetchCart();
      } catch (error) {
        throw error;
      }
    },
    [fetchCart],
  );

  const removeItemFromCart = useCallback(
    async (menuItemId: string) => {
      setCart((prevCart) => {
        if (!prevCart) return null;
        const updatedItems = prevCart.items.filter(
          (item) => item.menuItemId._id !== menuItemId,
        );
        if (updatedItems.length === 0) return null;

        const subtotal = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const grandTotal = Math.max(0, subtotal - (prevCart.discountAmount || 0));
        return {
          ...prevCart,
          items: updatedItems,
          subtotal,
          grandTotal,
        };
      });

      try {
        await api.delete(`/cart/items/${menuItemId}`);
        await fetchCart();
      } catch (error) {
        await fetchCart();
        throw error;
      }
    },
    [fetchCart],
  );

  const updateItemQuantity = useCallback(
    async (menuItemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        return removeItemFromCart(menuItemId);
      }

      setCart((prevCart) => {
        if (!prevCart) return null;
        const updatedItems = prevCart.items.map((item) =>
          item.menuItemId._id === menuItemId
            ? { ...item, quantity: newQuantity }
            : item,
        );
        const subtotal = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const grandTotal = Math.max(0, subtotal - (prevCart.discountAmount || 0));
        return {
          ...prevCart,
          items: updatedItems,
          subtotal,
          grandTotal,
        };
      });

      try {
        await api.patch(`/cart/items/${menuItemId}`, { quantity: newQuantity });
        await fetchCart();
      } catch (error) {
        await fetchCart();
        throw error;
      }
    },
    [fetchCart, removeItemFromCart],
  );

  const clearCart = useCallback(async () => {
    setCart(null);
    try {
      await api.delete("/cart");
      await fetchCart();
    } catch (error) {
      await fetchCart();
      throw error;
    }
  }, [fetchCart]);

  const value = useMemo(
    () => ({
      cart,
      isLoading,
      fetchCart,
      addItemToCart,
      updateItemQuantity,
      removeItemFromCart,
      clearCart,
    }),
    [
      cart,
      isLoading,
      fetchCart,
      addItemToCart,
      updateItemQuantity,
      removeItemFromCart,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
