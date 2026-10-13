"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search, UserPlus, Shield, Trash2, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
} from "@/lib/admin";
import type { AdminRole, AdminUser } from "@/types/admin";

const ROLE_OPTIONS: AdminRole[] = ["user", "admin", "superadmin"];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { hasInitialized, checkAuth } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!hasInitialized) return;
    let isActive = true;

    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);

      const isAuthenticated = await checkAuth();
      const currentUser = useAuthStore.getState().user;

      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      if (!currentUser || currentUser.role !== "superadmin") {
        if (isActive) {
          setAccessDenied(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getAdminUsers({
          page,
          limit,
          search: debouncedSearch || undefined,
        });
        if (!isActive) return;
        setUsers(response.users);
        setTotalPages(response.totalPages || 1);
        setTotal(response.total || response.users.length);
        setAccessDenied(false);
      } catch (err) {
        if (!isActive) return;
        const message = getApiErrorMessage(err, "Unable to load users.");
        setError(message);
        if (message.toLowerCase().includes("super admin")) {
          setAccessDenied(true);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadUsers();
    return () => {
      isActive = false;
    };
  }, [checkAuth, debouncedSearch, hasInitialized, limit, page, refreshKey, router]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handleRoleChange = async (userId: string, role: AdminRole) => {
    const existing = users.find((user) => user._id === userId);
    if (!existing || existing.role === role) return;

    setIsUpdatingId(userId);
    setUsers((current) =>
      current.map((user) => (user._id === userId ? { ...user, role } : user)),
    );

    try {
      const updated = await updateAdminUserRole(userId, role);
      setUsers((current) =>
        current.map((user) => (user._id === userId ? updated : user)),
      );
      toast.success(`Role updated for ${updated.name || updated.email}`);
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to update user role.");
      toast.error(message);
      setRefreshKey((prev) => prev + 1);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    const user = users.find((item) => item._id === userId);
    const confirmMessage = user
      ? `Delete ${user.name || user.email}? This action cannot be undone.`
      : "Delete this user? This action cannot be undone.";
    if (!window.confirm(confirmMessage)) return;

    setIsDeletingId(userId);
    try {
      await deleteAdminUser(userId);
      toast.success("User deleted.");
      if (users.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to delete user."));
    } finally {
      setIsDeletingId(null);
    }
  };

  const summaryLabel = useMemo(() => {
    if (isLoading) return "Loading users...";
    if (users.length === 0) return "No users found";
    return `Showing ${users.length} of ${total} users`;
  }, [isLoading, total, users.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-[#0B0F6B] animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Super admin access only
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You don&apos;t have permission to manage users. Please contact the
            primary administrator if you need access.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-[#0B0F6B] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 text-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Super Admin
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-slate-950">
                User Management
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Search users, manage roles, and keep access under control.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search users..."
                  className="w-full min-w-[220px] rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-[#0B0F6B] focus:outline-none focus:ring-2 focus:ring-[#0B0F6B]/10"
                />
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <UserPlus className="h-4 w-4 text-[#0B0F6B]" />
                {summaryLabel}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="font-semibold text-slate-900 hover:text-[#0B0F6B]"
                      >
                        {user.name || "Unnamed"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          handleRoleChange(user._id, event.target.value as AdminRole)
                        }
                        disabled={isUpdatingId === user._id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0B0F6B] focus:outline-none focus:ring-2 focus:ring-[#0B0F6B]/10 disabled:opacity-60"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/users/${user._id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={isDeletingId === user._id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeletingId === user._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      {error || "No users found for this search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canGoPrev}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!canGoNext}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
