"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Address, UserProfile } from "@/types/user";

interface AddressFormState {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const emptyAddress: AddressFormState = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const { checkAuth, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    addresses: [],
  });
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    phone: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressFormState>(
    emptyAddress,
  );

  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault),
    [addresses],
  );

  const fetchProfile = async () => {
    setError(null);
    try {
      const response = await api.get("/users/me");
      const payload = response.data?.user || response.data;
      const fetchedProfile: UserProfile = {
        name: payload?.name || "",
        email: payload?.email || "",
        phone: payload?.phone || "",
        addresses: payload?.addresses || [],
      };
      setProfile(fetchedProfile);
      setProfileDraft({
        name: fetchedProfile.name,
        phone: fetchedProfile.phone || "",
      });
      setAddresses(fetchedProfile.addresses || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load profile."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      await fetchProfile();
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    setError(null);
    try {
      const response = await api.put("/users/me", {
        name: profileDraft.name.trim(),
        phone: profileDraft.phone.trim(),
      });
      const payload = response.data?.user || response.data;
      setProfile((prev) => ({
        ...prev,
        name: payload?.name || profileDraft.name,
        phone: payload?.phone || profileDraft.phone,
      }));
      setIsEditingProfile(false);
      toast.success("Profile updated");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to update profile");
      setError(message);
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openAddressForm = (address?: Address) => {
    if (address) {
      setEditingAddressId(address._id);
      setAddressDraft({
        label: address.label || "",
        fullName: address.fullName || "",
        phone: address.phone || "",
        line1: address.line1 || "",
        line2: address.line2 || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "",
        isDefault: Boolean(address.isDefault),
      });
    } else {
      setEditingAddressId(null);
      setAddressDraft(emptyAddress);
    }
    setIsAddressFormOpen(true);
  };

  const handleAddressSave = async () => {
    setIsSavingAddress(true);
    setError(null);

    const payload = {
      ...addressDraft,
      label: addressDraft.label.trim(),
      fullName: addressDraft.fullName.trim(),
      phone: addressDraft.phone.trim(),
      line1: addressDraft.line1.trim(),
      line2: addressDraft.line2.trim(),
      city: addressDraft.city.trim(),
      state: addressDraft.state.trim(),
      postalCode: addressDraft.postalCode.trim(),
      country: addressDraft.country.trim(),
    };

    try {
      if (editingAddressId) {
        await api.put(`/users/me/addresses/${editingAddressId}`, payload);
        toast.success("Address updated");
      } else {
        await api.post("/users/me/addresses", payload);
        toast.success("Address added");
      }
      setIsAddressFormOpen(false);
      await fetchProfile();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save address");
      setError(message);
      toast.error(message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    try {
      await api.delete(`/users/me/addresses/${addressId}`);
      setAddresses((prev) => prev.filter((address) => address._id !== addressId));
      toast.success("Address deleted");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to delete address");
      setError(message);
      toast.error(message);
    }
  };

  const handleSetDefault = async (address: Address) => {
    const previous = addresses;
    setAddresses((prev) =>
      prev.map((item) => ({ ...item, isDefault: item._id === address._id })),
    );
    try {
      await api.put(`/users/me/addresses/${address._id}`, {
        ...address,
        isDefault: true,
      });
      toast.success("Default address updated");
    } catch (err) {
      setAddresses(previous);
      const message = getApiErrorMessage(err, "Failed to set default address");
      setError(message);
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-[#4A230F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black">
              Profile
            </h1>
            <p className="mt-2 text-sm text-black">
              Manage your account details and delivery addresses.
            </p>
          </div>
          <Link
            href="/orders"
            className="rounded-full border border-[#4A230F]/20 bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-[#4A230F] hover:text-white transition"
          >
            View orders
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-black">
            {error}
          </div>
        )}

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Profile Information
              </h2>
              <p className="mt-1 text-sm text-black">
                Keep your details up to date.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile((prev) => !prev);
                setProfileDraft({
                  name: profile.name,
                  phone: profile.phone || "",
                });
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50"
            >
              {isEditingProfile ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Name
              </label>
              <input
                type="text"
                value={isEditingProfile ? profileDraft.name : profile.name}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={!isEditingProfile}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Phone
              </label>
              <input
                type="text"
                value={isEditingProfile ? profileDraft.phone : profile.phone || ""}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))
                }
                disabled={!isEditingProfile}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40 disabled:bg-slate-50"
              />
            </div>
          </div>

          {isEditingProfile && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="rounded-full bg-[#4A230F] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5A260F] disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-black">Addresses</h2>
              <p className="mt-1 text-sm text-black">
                Save addresses for faster checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddressForm()}
              className="rounded-full bg-[#1B2E27] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5A260F]"
            >
              Add address
            </button>
          </div>

          {addresses.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-black">
              No addresses saved yet. Add one to speed up checkout.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  address.isDefault
                    ? "border-[#F4B223] bg-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      {address.label}
                    </p>
                    <p className="mt-1 text-sm text-black">
                      {address.fullName}
                    </p>
                    <p className="text-sm text-black">{address.phone}</p>
                  </div>
                  {address.isDefault && (
                    <span className="rounded-full bg-[#4A230F] px-3 py-1 text-xs font-semibold text-white">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-4 text-sm text-black space-y-1">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openAddressForm(address)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-black hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(address._id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-black hover:bg-rose-100"
                  >
                    Delete
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address)}
                      className="rounded-full border border-[#1B2E27]/30 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#1B2E27]/10"
                    >
                      Set default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {defaultAddress && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-black">
              Default address: {defaultAddress.line1}, {defaultAddress.city}
            </div>
          )}

          {isAddressFormOpen && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  {editingAddressId ? "Edit address" : "Add new address"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressFormOpen(false)}
                  className="text-sm font-semibold text-black hover:text-black"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Label
                  </label>
                  <input
                    type="text"
                    value={addressDraft.label}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                    placeholder="Home, Office"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={addressDraft.fullName}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={addressDraft.phone}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Line 1
                  </label>
                  <input
                    type="text"
                    value={addressDraft.line1}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        line1: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Line 2
                  </label>
                  <input
                    type="text"
                    value={addressDraft.line2}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        line2: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={addressDraft.city}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={addressDraft.state}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Postal code
                  </label>
                  <input
                    type="text"
                    value={addressDraft.postalCode}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={addressDraft.country}
                    onChange={(e) =>
                      setAddressDraft((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B223]/40"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={addressDraft.isDefault}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({
                      ...prev,
                      isDefault: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-black focus:ring-[#F4B223]/40"
                />
                <span className="text-sm text-black">Set as default</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddressFormOpen(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-black hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddressSave}
                  disabled={isSavingAddress}
                  className="rounded-full bg-[#4A230F] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5A260F] disabled:opacity-50"
                >
                  {isSavingAddress ? "Saving..." : "Save address"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

