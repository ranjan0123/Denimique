import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { getApiErrorMessage, resolveApiAssetUrl } from "@/lib/api";
import type { CartApiItem, CartApiResponse, CartItem } from "@/types/commerce";
import { useAuthStore } from "@/store/authStore";

interface CartState {
  cart: CartItem[];
  subtotal: number;
  hasGuestChanges: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  loadCart: () => Promise<void>;
  syncGuestCartToDb: () => Promise<void>;
  addToCart: (
    productId: string,
    quantity?: number,
    variantId?: string,
  ) => Promise<void>;
  updateItemQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  resetCart: () => void;
  setHasHydrated: (state: boolean) => void;
}

const isAuthenticatedSession = () => {
  const { isAuthenticated, token } = useAuthStore.getState();
  return Boolean(isAuthenticated && token);
};

const buildGuestItemId = (productId: string, variantId?: string) =>
  variantId ? `${productId}::${variantId}` : productId;

const calculateSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

interface GuestProductVariant {
  _id?: string;
  id?: string;
  label?: string;
  price?: number;
  discountPrice?: number;
}

interface GuestProductPayload {
  _id?: string;
  id?: string;
  slug?: string;
  handle?: string;
  name?: string;
  title?: string;
  image?: string;
  images?: Array<string | { src?: string; url?: string }>;
  basePrice?: number;
  price?: number;
  discountPrice?: number;
  variants?: GuestProductVariant[];
}

interface GuestProductResponse {
  product?: GuestProductPayload;
  data?: GuestProductPayload;
}

const extractProductPayload = (
  data: GuestProductResponse | GuestProductPayload | unknown,
): GuestProductPayload => {
  if (!data || typeof data !== "object") return {};
  const payload = data as GuestProductResponse & GuestProductPayload;
  return payload.product || payload.data || payload;
};

const pickVariant = (product: GuestProductPayload, variantId?: string) => {
  if (!variantId) return undefined;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find(
    (variant) => (variant?.id || variant?._id || "") === variantId,
  );
};

const buildGuestItemFromProduct = (
  productData: GuestProductResponse | GuestProductPayload | unknown,
  quantity: number,
  variantId?: string,
): CartItem => {
  const product = extractProductPayload(productData);
  const productId = product._id || product.id || "";
  const variant = pickVariant(product, variantId);
  const basePrice =
    product.basePrice ?? product.price ?? variant?.price ?? product.variants?.[0]?.price ?? 0;
  const discountPrice = variant?.discountPrice ?? product.discountPrice;
  const unitPrice =
    typeof discountPrice === "number" &&
    discountPrice > 0 &&
    discountPrice < basePrice
      ? discountPrice
      : variant?.price ?? basePrice;
  const rawImage = product.images?.[0] || product.image || "";
  const image = resolveApiAssetUrl(
    typeof rawImage === "string" ? rawImage : rawImage.src || rawImage.url || "",
  );

  return {
    id: buildGuestItemId(productId, variantId),
    productId,
    slug: product.slug || product.handle || product.id || "",
    name: product.name || product.title || product.handle || "",
    image,
    quantity,
    unitPrice,
    basePrice,
    variantId,
    variantLabel: variant?.label,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object");

const extractCartPayload = (
  data: CartApiResponse | Record<string, unknown>,
): { items: CartApiItem[]; subtotal: number } => {
  const root = isRecord(data) ? data : {};
  const payload =
    (isRecord(root.cart) && root.cart) ||
    (isRecord(root.data) && root.data) ||
    root;

  const rawItems = payload.items ?? payload.cartItems ?? payload.cart ?? root.items;
  const items = Array.isArray(rawItems) ? (rawItems as CartApiItem[]) : [];
  const subtotal =
    typeof payload.subtotal === "number"
      ? payload.subtotal
      : typeof payload.total === "number"
        ? payload.total
        : typeof root.subtotal === "number"
          ? root.subtotal
          : 0;

  return { items, subtotal };
};

const normalizeCartItem = (item: CartApiItem): CartItem => {
  const product = item.product || {};
  const id = item._id || item.id || "";
  const productId =
    item.productId || product._id || product.id || item.product?._id || "";
  const variantLabel =
    item.variantLabel ||
    item.variant?.label ||
    item.productVariant?.label ||
    undefined;
  const rawImage =
    item.image || item.productImage || product.images?.[0] || product.image || "";
  const image =
    typeof rawImage === "string" ? rawImage : rawImage.src || rawImage.url || "";

  return {
    id,
    productId,
    slug: item.slug || product.slug || product.handle || "",
    name: item.name || product.name || product.title || product.handle || "",
    image: resolveApiAssetUrl(image),
    quantity: typeof item.quantity === "number" ? item.quantity : 1,
    unitPrice:
      typeof item.unitPrice === "number"
        ? item.unitPrice
        : typeof item.price === "number"
          ? item.price
          : typeof item.lineTotal === "number" && item.quantity
            ? item.lineTotal / item.quantity
            : product.discountPrice || product.basePrice || 0,
    basePrice:
      typeof item.basePrice === "number"
        ? item.basePrice
        : product.basePrice,
    variantId: item.variantId || item.variant?._id || item.variant?.id,
    variantLabel,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      subtotal: 0,
      hasGuestChanges: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      loadCart: async () => {
        if (!isAuthenticatedSession()) {
          set({ isLoading: false, error: null, hasHydrated: true });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await api.get("/cart");
          const { items, subtotal } = extractCartPayload(response.data);
          set({
            cart: (items || []).map(normalizeCartItem),
            subtotal: subtotal || 0,
            hasGuestChanges: false,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to load cart.");
          set({
            isLoading: false,
            error: message,
            hasHydrated: true,
          });
        }
      },

      syncGuestCartToDb: async () => {
        if (!isAuthenticatedSession()) {
          return;
        }

        if (!get().hasGuestChanges) {
          return;
        }

        const guestItems = [...get().cart];
        set({ isLoading: true, error: null });
        try {
          for (const item of guestItems) {
            await api.post("/cart/items", {
              productId: item.productId,
              quantity: item.quantity,
              variantId: item.variantId,
            });
          }
          const response = await api.get("/cart");
          const { items, subtotal } = extractCartPayload(response.data);
          set({
            cart: (items || []).map(normalizeCartItem),
            subtotal: subtotal || 0,
            hasGuestChanges: false,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to sync cart.");
          set({ isLoading: false, error: message, hasHydrated: true });
        }
      },

      addToCart: async (productId, quantity = 1, variantId) => {
        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            const response = await api.post("/cart/items", {
              productId,
              quantity,
              variantId,
            });
            const { items, subtotal } = extractCartPayload(response.data);
            set({
              cart: (items || []).map(normalizeCartItem),
              subtotal: subtotal || 0,
              hasGuestChanges: false,
              isLoading: false,
              hasHydrated: true,
            });
            return;
          }

          const response = await api.get(`/products/${productId}`);
          const incomingItem = buildGuestItemFromProduct(
            response.data,
            quantity,
            variantId,
          );

          const existing = get().cart.find(
            (item) => item.id === incomingItem.id,
          );
          const nextCart = existing
            ? get().cart.map((item) =>
                item.id === incomingItem.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...get().cart, incomingItem];

          set({
            cart: nextCart,
            subtotal: calculateSubtotal(nextCart),
            hasGuestChanges: true,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to add item to cart.");
          set({ isLoading: false, error: message, hasHydrated: true });
          throw new Error(message);
        }
      },

      updateItemQty: async (itemId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(itemId);
          return;
        }

        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            const response = await api.put(`/cart/items/${itemId}`, { quantity });
            const { items, subtotal } = extractCartPayload(response.data);
            set({
              cart: (items || []).map(normalizeCartItem),
              subtotal: subtotal || 0,
              hasGuestChanges: false,
              isLoading: false,
              hasHydrated: true,
            });
            return;
          }

          const nextCart = get().cart.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          );
          set({
            cart: nextCart,
            subtotal: calculateSubtotal(nextCart),
            hasGuestChanges: true,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to update cart item.");
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      removeItem: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            const response = await api.delete(`/cart/items/${itemId}`);
            const { items, subtotal } = extractCartPayload(response.data || {});
            set({
              cart: (items || []).map(normalizeCartItem),
              subtotal: subtotal || 0,
              hasGuestChanges: false,
              isLoading: false,
              hasHydrated: true,
            });
            return;
          }

          const nextCart = get().cart.filter((item) => item.id !== itemId);
          set({
            cart: nextCart,
            subtotal: calculateSubtotal(nextCart),
            hasGuestChanges: true,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to remove cart item.");
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            await api.delete("/cart");
          }
          set({
            cart: [],
            subtotal: 0,
            hasGuestChanges: !isAuthenticatedSession(),
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to clear cart.");
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      resetCart: () =>
        set({
          cart: [],
          subtotal: 0,
          hasGuestChanges: false,
          isLoading: false,
          error: null,
          hasHydrated: true,
        }),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        cart: state.cart,
        subtotal: state.subtotal,
        hasGuestChanges: state.hasGuestChanges,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
