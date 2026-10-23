"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { init, isAuthenticated, hasInitialized } = useAuthStore();
  const { syncGuestCartToDb } = useCartStore();
  const { syncGuestWishlistToDb } = useWishlistStore();
  const hasSyncedAfterAuth = useRef(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!hasInitialized) return;

    if (!isAuthenticated) {
      hasSyncedAfterAuth.current = false;
      return;
    }

    if (hasSyncedAfterAuth.current) return;
    hasSyncedAfterAuth.current = true;

    const syncGuestData = async () => {
      await Promise.all([syncGuestCartToDb(), syncGuestWishlistToDb()]);
    };

    syncGuestData();
  }, [
    hasInitialized,
    isAuthenticated,
    syncGuestCartToDb,
    syncGuestWishlistToDb,
  ]);

  return <>{children}</>;
}
