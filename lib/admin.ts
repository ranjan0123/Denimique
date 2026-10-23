import api from "@/lib/api";
import type {
  AdminCartOverview,
  AdminOrdersOverview,
  AdminPagination,
  AdminSummaryOverview,
  AdminUser,
  AdminUserOverview,
  AdminUsersResponse,
  AdminWishlistOverview,
} from "@/types/admin";
import type { CartApiItem, Order, WishlistApiItem } from "@/types/commerce";
import type { Address } from "@/types/user";

type RawAdminUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  phone?: string;
  addresses?: Address[];
};

type RawPagination = {
  page?: number;
  limit?: number;
  total?: number;
  totalItems?: number;
  totalPages?: number;
  pages?: number;
};

type RawAdminOverview = {
  user?: RawAdminUser;
  cart?: {
    subtotal?: number;
    items?: CartApiItem[];
    totalItems?: number;
    pagination?: RawPagination;
  };
  wishlist?: {
    items?: WishlistApiItem[];
    totalItems?: number;
    pagination?: RawPagination;
  };
  orders?: {
    items?: Order[];
    pagination?: RawPagination;
  };
  summary?: {
    totalOrders?: number;
    totalSpent?: number;
    cartItems?: number;
    wishlistItems?: number;
  };
};

type RawAdminUsersResponse = {
  users?: RawAdminUser[];
  data?: RawAdminUser[];
  items?: RawAdminUser[];
  total?: number;
  totalUsers?: number;
  count?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  pageSize?: number;
  totalPages?: number;
  pages?: number;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const normalizeAdminUser = (user: RawAdminUser): AdminUser => ({
  _id: user._id || "",
  name: user.name || "",
  email: user.email || "",
  role: (user.role || "user") as AdminUser["role"],
  createdAt: user.createdAt || "",
  phone: user.phone,
  addresses: user.addresses || [],
});

const pickNumber = (...values: Array<number | undefined>): number => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};

const normalizePagination = (
  pagination: RawPagination | undefined,
  fallback: { page: number; limit: number; totalItems: number },
): AdminPagination => {
  const page = pickNumber(pagination?.page) || fallback.page;
  const limit = pickNumber(pagination?.limit) || fallback.limit;
  const totalItems =
    pickNumber(pagination?.total, pagination?.totalItems) || fallback.totalItems;
  const totalPages =
    pickNumber(pagination?.totalPages, pagination?.pages) ||
    (limit ? Math.max(1, Math.ceil(totalItems / limit)) : 1);

  return { page, limit, totalItems, totalPages };
};

export const getAdminUsers = async ({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AdminUsersResponse> => {
  const response = await api.get("/admin/users", {
    params: { page, limit, search },
  });

  const payload = response.data as RawAdminUsersResponse;
  const rawUsers = payload.users || payload.data || payload.items || [];
  const total = pickNumber(
    payload.total,
    payload.totalUsers,
    payload.count,
    payload.pagination?.total,
  );
  const resolvedLimit = pickNumber(payload.limit, payload.pageSize, payload.pagination?.limit) || limit;
  const resolvedPage = pickNumber(payload.page, payload.currentPage, payload.pagination?.page) || page;
  const totalPages =
    pickNumber(payload.totalPages, payload.pages, payload.pagination?.totalPages) ||
    (resolvedLimit ? Math.max(1, Math.ceil((total || rawUsers.length) / resolvedLimit)) : 1);

  return {
    users: rawUsers.map(normalizeAdminUser),
    page: resolvedPage,
    limit: resolvedLimit,
    total: total || rawUsers.length,
    totalPages,
  };
};

export const getAdminUserById = async (id: string): Promise<AdminUser> => {
  const response = await api.get(`/admin/users/${id}`);
  const rawUser = (response.data?.user || response.data) as RawAdminUser;
  return normalizeAdminUser(rawUser);
};

export const updateAdminUserRole = async (
  id: string,
  role: AdminUser["role"],
): Promise<AdminUser> => {
  const response = await api.put(`/admin/users/${id}/role`, { role });
  const rawUser = (response.data?.user || response.data) as RawAdminUser;
  return normalizeAdminUser(rawUser);
};

export const deleteAdminUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

export const getAdminUserOverview = async (
  id: string,
  params: {
    ordersPage: number;
    ordersLimit: number;
    cartPage: number;
    cartLimit: number;
    wishlistPage: number;
    wishlistLimit: number;
  },
): Promise<AdminUserOverview> => {
  const response = await api.get(`/admin/users/${id}/overview`, {
    params,
  });

  const payload = response.data as RawAdminOverview;
  const user = normalizeAdminUser(payload.user || {});

  const cartItems = payload.cart?.items || [];
  const cartTotalItems =
    pickNumber(payload.cart?.totalItems) || cartItems.length;
  const cart: AdminCartOverview = {
    subtotal: payload.cart?.subtotal || 0,
    items: cartItems,
    totalItems: cartTotalItems,
    pagination: normalizePagination(payload.cart?.pagination, {
      page: params.cartPage,
      limit: params.cartLimit,
      totalItems: cartTotalItems,
    }),
  };

  const wishlistItems = payload.wishlist?.items || [];
  const wishlistTotalItems =
    pickNumber(payload.wishlist?.totalItems) || wishlistItems.length;
  const wishlist: AdminWishlistOverview = {
    items: wishlistItems,
    totalItems: wishlistTotalItems,
    pagination: normalizePagination(payload.wishlist?.pagination, {
      page: params.wishlistPage,
      limit: params.wishlistLimit,
      totalItems: wishlistTotalItems,
    }),
  };

  const orderItems = payload.orders?.items || [];
  const orderTotalItems =
    pickNumber(
      payload.orders?.pagination?.total,
      payload.orders?.pagination?.totalItems,
    ) || orderItems.length;
  const orders: AdminOrdersOverview = {
    items: orderItems,
    pagination: normalizePagination(payload.orders?.pagination, {
      page: params.ordersPage,
      limit: params.ordersLimit,
      totalItems: orderTotalItems,
    }),
  };

  const summary: AdminSummaryOverview = {
    totalOrders: payload.summary?.totalOrders || 0,
    totalSpent: payload.summary?.totalSpent || 0,
    cartItems: payload.summary?.cartItems || cart.totalItems,
    wishlistItems: payload.summary?.wishlistItems || wishlist.totalItems,
  };

  return {
    user,
    cart,
    wishlist,
    orders,
    summary,
  };
};
