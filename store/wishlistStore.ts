import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { getApiErrorMessage, resolveApiAssetUrl } from "@/lib/api";
import type { WishlistApiItem, WishlistApiResponse } from "@/types/commerce";
import { useAuthStore } from "@/store/authStore";

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  price?: number;
}

interface WishlistState {
  items: WishlistItem[];
  hasGuestChanges: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  loadWishlist: () => Promise<void>;
  syncGuestWishlistToDb: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

const isAuthenticatedSession = () => {
  const { isAuthenticated, token } = useAuthStore.getState();
  return Boolean(isAuthenticated && token);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object");

const extractWishlistItems = (
  data: WishlistApiResponse | Record<string, unknown>,
): WishlistApiItem[] => {
  const root = isRecord(data) ? data : {};
  const payload =
    (isRecord(root.wishlist) && root.wishlist) ||
    (isRecord(root.data) && root.data) ||
    root;
  const rawItems = payload.items ?? payload.products ?? payload;
  return Array.isArray(rawItems) ? (rawItems as WishlistApiItem[]) : [];
};

const normalizeWishlistItem = (item: WishlistApiItem): WishlistItem => {
  const product = item.product || {};
  const id = item._id || item.id || "";
  const productId =
    (typeof item.product === "string" && item.product) ||
    item.productId ||
    product._id ||
    product.id ||
    "";
  const image = item.image || product.images?.[0] || product.image || "";

  return {
    id,
    productId,
    name: item.name || product.name || "",
    slug: item.slug || product.slug || "",
    image: resolveApiAssetUrl(image),
    price:
      typeof item.price === "number"
        ? item.price
        : product.discountPrice || product.basePrice,
  };
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasGuestChanges: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      loadWishlist: async () => {
        if (!isAuthenticatedSession()) {
          set({ isLoading: false, error: null, hasHydrated: true });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await api.get("/wishlist");
          const items = extractWishlistItems(response.data).map(normalizeWishlistItem);
          set({
            items,
            hasGuestChanges: false,
            isLoading: false,
            error: null,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to load wishlist.");
          set({ isLoading: false, error: message, hasHydrated: true });
        }
      },

      syncGuestWishlistToDb: async () => {
        if (!isAuthenticatedSession()) {
          return;
        }

        if (!get().hasGuestChanges) {
          return;
        }

        const guestItems = [...get().items];
        set({ isLoading: true, error: null });
        try {
          for (const item of guestItems) {
            await api.post("/wishlist/items", { productId: item.productId });
          }
          const response = await api.get("/wishlist");
          const items = extractWishlistItems(response.data).map(normalizeWishlistItem);
          set({
            items,
            hasGuestChanges: false,
            isLoading: false,
            error: null,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to sync wishlist.");
          set({ isLoading: false, error: message, hasHydrated: true });
        }
      },

      addToWishlist: async (productId) => {
        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            const response = await api.post("/wishlist/items", { productId });
            const items = extractWishlistItems(response.data).map(normalizeWishlistItem);
            set({
              items,
              hasGuestChanges: false,
              isLoading: false,
              error: null,
              hasHydrated: true,
            });
            return;
          }

          const existing = get().items.find((item) => item.productId === productId);
          if (existing) {
            set({ isLoading: false, error: null, hasHydrated: true });
            return;
          }

          const response = await api.get(`/products/${productId}`);
          const product = response.data?.product || response.data?.data || response.data;
          const image = resolveApiAssetUrl(product?.images?.[0] || product?.image || "");
          const nextItems = [
            ...get().items,
            {
              id: product?._id || product?.id || productId,
              productId: product?._id || product?.id || productId,
              name: product?.name || "",
              slug: product?.slug || "",
              image,
              price: product?.discountPrice || product?.basePrice,
            },
          ];
          set({
            items: nextItems,
            hasGuestChanges: true,
            isLoading: false,
            error: null,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to add to wishlist.");
          set({ isLoading: false, error: message, hasHydrated: true });
          throw new Error(message);
        }
      },

      removeFromWishlist: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            const response = await api.delete(`/wishlist/items/${itemId}`);
            const items = extractWishlistItems(response.data || {}).map(
              normalizeWishlistItem,
            );
            set({
              items,
              hasGuestChanges: false,
              isLoading: false,
              error: null,
              hasHydrated: true,
            });
            return;
          }

          const nextItems = get().items.filter((item) => item.id !== itemId);
          set({
            items: nextItems,
            hasGuestChanges: true,
            isLoading: false,
            error: null,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to remove wishlist item.");
          set({ isLoading: false, error: message, hasHydrated: true });
          throw new Error(message);
        }
      },

      clearWishlist: async () => {
        set({ isLoading: true, error: null });
        try {
          if (isAuthenticatedSession()) {
            await api.delete("/wishlist");
          }
          set({
            items: [],
            hasGuestChanges: !isAuthenticatedSession(),
            isLoading: false,
            error: null,
            hasHydrated: true,
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, "Unable to clear wishlist.");
          set({ isLoading: false, error: message, hasHydrated: true });
          throw new Error(message);
        }
      },
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({
        items: state.items,
        hasGuestChanges: state.hasGuestChanges,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
