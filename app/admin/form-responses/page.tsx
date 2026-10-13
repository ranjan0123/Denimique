"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

type FormResponseType = "contact" | "newsletter" | "wholesale" | "blog-subscribe";

interface FormResponse {
  _id: string;
  type: FormResponseType;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  message?: string;
  monthlyRequirement?: string;
  sourceUrl?: string;
  status: "new" | "read" | "closed";
  createdAt: string;
}

export default function AdminFormResponsesPage() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FormResponseType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read" | "closed">("all");

  const fetchResponses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await api.get("/forms/admin", { params });
      setResponses(response.data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load responses"));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    const auth = checkAuth();
    if (!auth) {
      router.push("/login");
      return;
    }
    // Data fetch kicked off on mount/filter change; fetchResponses sets its
    // own loading flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResponses();
  }, [checkAuth, router, fetchResponses]);

  const counts = useMemo(() => {
    const total = responses.length;
    const newCount = responses.filter((r) => r.status === "new").length;
    const readCount = responses.filter((r) => r.status === "read").length;
    const closedCount = responses.filter((r) => r.status === "closed").length;
    return { total, newCount, readCount, closedCount };
  }, [responses]);

  const handleStatusChange = async (id: string, status: FormResponse["status"]) => {
    try {
      await api.patch(`/forms/admin/${id}/status`, { status });
      toast.success("Status updated");
      fetchResponses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this response?")) return;
    try {
      await api.delete(`/forms/admin/${id}`);
      toast.success("Response deleted");
      fetchResponses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete response"));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="bg-white border-b border-slate-200">
        <div className="w-full px-6 lg:px-10 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Form Responses
            </h1>
            <p className="text-slate-600 mt-1">
              Manage messages from contact, newsletter, wholesale, and blog forms.
            </p>
          </div>
          <Link href="/admin" className="text-[#0B0F6B] hover:text-[#151b87]">
            {"<-"} Back to Admin
          </Link>
        </div>
      </div>

      <div className="w-full px-6 lg:px-10 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total", value: counts.total },
            { label: "New", value: counts.newCount },
            { label: "Read", value: counts.readCount },
            { label: "Closed", value: counts.closedCount },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FormResponseType | "all")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="contact">Contact</option>
              <option value="newsletter">Newsletter</option>
              <option value="wholesale">Wholesale</option>
              <option value="blog-subscribe">Blog Subscribe</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "new" | "read" | "closed")
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Latest Responses
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading...</div>
          ) : responses.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No responses found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {responses.map((response) => (
                <div key={response._id} className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#0B0F6B]/10 px-3 py-1 text-xs font-semibold text-[#0B0F6B]">
                          {response.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        {response.name || response.email || "Anonymous"}
                      </p>
                      <div className="text-sm text-slate-600 space-y-1">
                        {response.email && <p>Email: {response.email}</p>}
                        {response.phone && <p>Phone: {response.phone}</p>}
                        {response.company && <p>Company: {response.company}</p>}
                        {response.city && <p>City: {response.city}</p>}
                        {response.monthlyRequirement && (
                          <p>Monthly Requirement: {response.monthlyRequirement}</p>
                        )}
                        {response.message && (
                          <p className="text-slate-700">{response.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleStatusChange(response._id, "read")}
                        className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                      >
                        Mark Read
                      </button>
                      <button
                        onClick={() => handleStatusChange(response._id, "closed")}
                        className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDelete(response._id)}
                        className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
