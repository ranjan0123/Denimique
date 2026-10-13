"use client";

import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import RecommendedProducts from "@/components/cart/RecommendedProducts";

export default function CartPage() {
  const {
    cart,
    subtotal,
    hasHydrated,
    isLoading,
    loadCart,
    removeItem,
    updateItemQty,
    clearCart,
  } = useCartStore();

  const { hasInitialized } = useAuthStore();

  // MAIN FUNCTION → LOAD CART
  useEffect(() => {
    if (hasInitialized) {
      loadCart();
    }
  }, [hasInitialized, loadCart]);

  // LOADING UI
  if (!hasInitialized || !hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 md:px-6 lg:py-14">
          <div className="mb-10">
            <div className="mb-3 h-9 w-52 rounded-lg bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.65fr_0.75fr]">
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5"
                >
                  <div className="h-28 w-28 rounded-xl bg-gray-200" />

                  <div className="flex-1 space-y-4">
                    <div className="h-5 w-2/3 rounded bg-gray-200" />
                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-10 w-32 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6">
              <div className="h-7 w-1/2 rounded bg-gray-200" />
              <div className="h-4 rounded bg-gray-200" />
              <div className="h-4 rounded bg-gray-200" />
              <div className="mt-6 h-12 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART
  if (cart.length === 0) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f3e9e3]">
            <ShoppingBag size={34} className="text-[#7A3511]" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#2d1d18] md:text-4xl">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-base leading-7 text-gray-500">
            Looks like you haven&apos;t added any products to your cart yet.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7A3511] to-[#5A260F] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(122,53,17,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(122,53,17,0.35)]"
          >
            Continue Shopping
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    );
  }

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // UPDATE QUANTITY
  const handleUpdateQty = async (itemId: string, quantity: number) => {
    try {
      await updateItemQty(itemId, quantity);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update cart item.",
      );

      loadCart();
    }
  };

  // REMOVE ITEM
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove cart item.",
      );

      loadCart();
    }
  };

  return (
    <section className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:py-14">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-[#7A3511]">
              YOUR SHOPPING BAG
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#2d1d18] md:text-4xl">
              Shopping Cart
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                await clearCart();
                toast.success("Cart cleared successfully");
              } catch (error) {
                toast.error("Unable to clear cart");
              }
            }}
            className="inline-flex w-fit items-center rounded-lg border border-[#dfc8b9] bg-white px-4 py-2.5 text-sm font-medium text-[#7A3511] transition-all hover:border-[#7A3511] hover:bg-[#fff8f4]"
          >
            Clear Cart
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-[1.65fr_0.75fr] xl:gap-10">
          {/* CART ITEMS */}
          <div className="space-y-4">
            {cart.map((item) => {
              const lineTotal = item.unitPrice * item.quantity;

              return (
                <div
                  key={item.id}
                  className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-6 sm:p-5"
                >
                  {/* PRODUCT IMAGE */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-[#faf8f6] sm:h-32 sm:w-32">
                    <Image
                      src={item.image || "/logo-removebg-preview.png"}
                      alt={item.name}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* PRODUCT DETAILS */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={item.slug ? `/products/${item.slug}` : "/shop"}
                          className="line-clamp-2 text-base font-semibold leading-6 text-[#2d1d18] transition-colors hover:text-[#7A3511] sm:text-lg"
                        >
                          {item.name}
                        </Link>

                        <p className="mt-2 text-sm text-gray-500">
                          Price:{" "}
                          <span className="font-medium text-[#2d1d18]">
                            Rs. {item.unitPrice}
                          </span>
                        </p>
                      </div>

                      {/* REMOVE */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* QUANTITY + TOTAL */}
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                          Quantity
                        </p>

                        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                          <button
                            onClick={() =>
                              handleUpdateQty(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center text-lg text-[#7A3511] transition-colors hover:bg-[#f8f2ee]"
                          >
                            −
                          </button>

                          <span className="px-3 md:px-4 py-1.5 text-base md:text-lg font-bold text-[#7A3511] bg-white min-w-[36px] text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              handleUpdateQty(item.id, item.quantity + 1)
                            }
                            className="flex h-10 w-10 items-center justify-center text-lg text-[#7A3511] transition-colors hover:bg-[#f8f2ee]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                          Total
                        </p>

                        <p className="text-lg font-bold text-[#2d1d18]">
                          Rs. {lineTotal}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-[#2d1d18]">Order Summary</h2>

            <div className="my-5 h-px bg-gray-100" />

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>

                <span className="font-semibold text-[#2d1d18]">
                  Rs. {subtotal}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Shipping</span>

                <span className="font-medium text-[#1b7d54]">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-gray-200" />

            {/* TOTAL */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#2d1d18]">
                Estimated Total
              </span>

              <span className="text-xl font-bold text-[#7A3511]">
                Rs. {subtotal}
              </span>
            </div>

            <p className="mt-5 text-sm leading-6 text-gray-500">
              Taxes, shipping charges, and promotional discounts will be
              calculated during checkout.
            </p>

            {/* CHECKOUT BUTTON - SUITABLE VASTRA THEME */}
            <Link
              href="/checkout"
              className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A3511] to-[#5A260F] px-5 py-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(122,53,17,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:from-[#5A260F] hover:to-[#7A3511] hover:shadow-[0_12px_28px_rgba(122,53,17,0.35)] active:translate-y-0"
            >
              Proceed to Checkout
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            {/* CONTINUE SHOPPING */}
            <Link
              href="/shop"
              className="mt-4 block text-center text-sm font-medium text-[#7A3511] transition-colors hover:text-[#5A260F] hover:underline"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>

        <RecommendedProducts
          excludeProductIds={cart.map((item) => item.productId)}
        />
      </div>
    </section>
  );
}
