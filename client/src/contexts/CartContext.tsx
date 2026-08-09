import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { api } from "../utils/api";
import { useAuth } from "./AuthContext";
import { Cart } from "../types/cart";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
        // Trường hợp 1: Có giỏ hàng, data là object Cart
        setCart(data);
      } else if (data && "cart" in data) {
        // Trường hợp 2: Giỏ hàng rỗng, ta set cart về null
        setCart(null);
      } else {
        setCart(null);
      }
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

  const value = useMemo(
    () => ({
      cart,
      isLoading,
      fetchCart,
    }),
    [cart, isLoading, fetchCart],
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
