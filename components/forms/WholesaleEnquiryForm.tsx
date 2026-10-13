"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";

const initialState = {
  name: "",
  businessName: "",
  phone: "",
  email: "",
  city: "",
  monthlyRequirement: "",
  message: "",
};

export default function WholesaleEnquiryForm() {
  const [formData, setFormData] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.businessName ||
      !formData.phone ||
      !formData.email ||
      !formData.city ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/forms/wholesale", {
        ...formData,
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      toast.success("Thanks! Our B2B team will reach out soon.");
      setFormData(initialState);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to submit enquiry."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/90 backdrop-blur-xl shadow-2xl border border-emerald-900/10 p-6 md:p-8 shadow-xl"
    >
      <h3 className="text-xl font-bold text-slate-900 mb-6">Send Enquiry</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name *"
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
          required
          aria-label="Full name"
        />
        <input
          type="text"
          name="businessName"
          placeholder="Business Name *"
          value={formData.businessName}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
          required
          aria-label="Business name"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number *"
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
          required
          aria-label="Phone number"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address *"
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
          required
          aria-label="Email address"
        />
        <input
          type="text"
          name="city"
          placeholder="City *"
          value={formData.city}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
          required
          aria-label="City"
        />
        <input
          type="text"
          name="monthlyRequirement"
          placeholder="Approximate Monthly Requirement (kg)"
          value={formData.monthlyRequirement}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
          aria-label="Monthly requirement"
        />
      </div>

      <textarea
        name="message"
        placeholder="Tell us about your specific requirements (flavors, packaging, etc.) *"
        rows={4}
        value={formData.message}
        onChange={handleChange}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3511]/20 focus:border-[#7A3511] transition-all"
        required
        aria-label="Requirements"
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full bg-gradient-to-r from-[#7A3511] to-[#5A260F] text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7A3511]/40 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending..." : "Send Enquiry"}
      </button>

      <p className="mt-3 text-xs text-center text-slate-500">
        By submitting, you agree to our privacy policy and terms
      </p>
    </form>
  );
}

