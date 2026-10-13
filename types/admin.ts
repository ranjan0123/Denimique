import type { CartApiItem, Order, WishlistApiItem } from "@/types/commerce";
import type { Address } from "@/types/user";

export type AdminRole = "user" | "admin" | "superadmin";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt?: string;
  phone?: string;
  addresses?: Address[];
}

export interface AdminUsersResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminCartOverview {
  subtotal: number;
  items: CartApiItem[];
  totalItems: number;
  pagination: AdminPagination;
}

export interface AdminWishlistOverview {
  items: WishlistApiItem[];
  totalItems: number;
  pagination: AdminPagination;
}

export interface AdminOrdersOverview {
  items: Order[];
  pagination: AdminPagination;
}

export interface AdminSummaryOverview {
  totalOrders: number;
  totalSpent: number;
  cartItems: number;
  wishlistItems: number;
}

export interface AdminUserOverview {
  user: AdminUser;
  cart: AdminCartOverview;
  wishlist: AdminWishlistOverview;
  orders: AdminOrdersOverview;
  summary: AdminSummaryOverview;
}
