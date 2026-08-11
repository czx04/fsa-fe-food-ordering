import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { cartService } from "../services/cartService";
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

const CART_QUERY_KEY = ["cart"] as const;

// Tính lại subtotal/grandTotal sau khi thay đổi items theo logic của server.
const recomputeTotals = (cart: Cart): Cart => {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discountAmount = cart.discountAmount || 0;
  return { ...cart, subtotal, grandTotal: Math.max(0, subtotal - discountAmount) };
};

const removeItemOptimistic = (
  cart: Cart | null | undefined,
  menuItemId: string,
): Cart | null => {
  if (!cart) return null;
  const items = cart.items.filter((item) => item.menuItemId._id !== menuItemId);
  if (items.length === 0) return null;
  return recomputeTotals({ ...cart, items });
};

const updateQuantityOptimistic = (
  cart: Cart | null | undefined,
  menuItemId: string,
  newQuantity: number,
): Cart | null => {
  if (!cart) return null;
  const items = cart.items.map((item) =>
    item.menuItemId._id === menuItemId
      ? { ...item, quantity: newQuantity }
      : item,
  );
  return recomputeTotals({ ...cart, items });
};


export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: cart,
    isLoading,
    refetch,
  } = useQuery<Cart | null>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
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
      if (data && "_id" in data) return data;
      return null;
    },
    enabled: isAuthenticated,
  });

  // Khi user đăng xuất → reset cart về null để tránh hiển thị giỏ hàng cũ.
  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.setQueryData(CART_QUERY_KEY, null);
    }
  }, [isAuthenticated, queryClient]);

  const addItemMutation = useMutation({
    mutationFn: (payload: AddToCartPayload) => cartService.addToCart(payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart | null>(CART_QUERY_KEY);
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: (vars: { menuItemId: string; quantity: number }) =>
      cartService.updateCartItemQuantity(vars.menuItemId, vars.quantity),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart | null>(CART_QUERY_KEY);
      queryClient.setQueryData<Cart | null>(CART_QUERY_KEY, (old) =>
        updateQuantityOptimistic(old, vars.menuItemId, vars.quantity),
      );
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (menuItemId: string) => cartService.removeCartItem(menuItemId),
    onMutate: async (menuItemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart | null>(CART_QUERY_KEY);
      queryClient.setQueryData<Cart | null>(CART_QUERY_KEY, (old) =>
        removeItemOptimistic(old, menuItemId),
      );
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/cart");
      return null;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart | null>(CART_QUERY_KEY);
      queryClient.setQueryData(CART_QUERY_KEY, null);
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(CART_QUERY_KEY, null);
    },
  });

  const fetchCart = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const addItemToCart = useCallback(
    (payload: AddToCartPayload) =>
      addItemMutation.mutateAsync(payload).then(() => undefined),
    [addItemMutation],
  );

  const updateItemQuantity = useCallback(
    (menuItemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        return removeItemMutation.mutateAsync(menuItemId).then(() => undefined);
      }
      return updateQuantityMutation
        .mutateAsync({ menuItemId, quantity: newQuantity })
        .then(() => undefined);
    },
    [updateQuantityMutation, removeItemMutation],
  );

  const removeItemFromCart = useCallback(
    (menuItemId: string) =>
      removeItemMutation.mutateAsync(menuItemId).then(() => undefined),
    [removeItemMutation],
  );

  const clearCart = useCallback(
    () => clearCartMutation.mutateAsync().then(() => undefined),
    [clearCartMutation],
  );

  const value = useMemo(
    () => ({
      cart: cart ?? null,
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
