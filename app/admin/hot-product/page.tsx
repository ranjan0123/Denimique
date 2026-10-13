"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "@/components/ui/AppImage";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, resolveApiAssetUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface IHotProduct {
  _id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  progressPercentage: number;
  couponCode: string;
  couponDescription: string;
  isEnabled: boolean;
  displayDuration: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface HotProductForm {
  productId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  progressPercentage: number;
  couponCode: string;
  couponDescription: string;
  isEnabled: boolean;
  startDate: string;
  endDate: string;
}

const createEmptyForm = (): HotProductForm => ({
  productId: "",
  originalPrice: 0,
  discountedPrice: 0,
  discountPercentage: 0,
  progressPercentage: 0,
  couponCode: "",
  couponDescription: "",
  isEnabled: false,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
});

export default function AdminHotProductPage() {
  const { checkAuth } = useAuthStore();
  const router = useRouter();
  const [hotProducts, setHotProducts] = useState<IHotProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<IHotProduct | null>(
    null,
  );
  const [formData, setFormData] = useState<HotProductForm>(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Array<{ _id: string; name: string }>>([]);

  // Check auth
  useEffect(() => {
    const auth = checkAuth();
    if (!auth) {
      router.push("/login");
    }
  }, [checkAuth, router]);

  const fetchHotProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/hot-product/admin");
      setHotProducts(response.data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to fetch hot products"));
      console.error("Error fetching hot products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products?limit=1000");
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch hot products and products list on mount; each sets its own
  // loading flag.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHotProducts();
    fetchProducts();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSelectProduct = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        productId,
      }));
    }
  };

  const calculateDiscount = () => {
    const { originalPrice, discountedPrice } = formData;
    if (originalPrice > 0) {
      const percentage = Math.round(
        ((originalPrice - discountedPrice) / originalPrice) * 100,
      );
      setFormData((prev) => ({
        ...prev,
        discountPercentage: Math.max(0, Math.min(100, percentage)),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.productId ||
      !formData.originalPrice ||
      !formData.discountedPrice
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.discountedPrice >= formData.originalPrice) {
      toast.error("Discounted price must be less than original price");
      return;
    }

    try {
      setSubmitting(true);

      if (selectedProduct) {
        // Update
        await api.put(
          `/hot-product/admin/${selectedProduct._id}`,
          formData,
        );
        toast.success("Hot product updated successfully");
      } else {
        // Create
        await api.post("/hot-product/admin", formData);
        toast.success("Hot product created successfully");
      }

      setFormData(createEmptyForm());
      setSelectedProduct(null);
      fetchHotProducts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save hot product"));
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: IHotProduct) => {
    setSelectedProduct(product);
    setFormData({
      productId: product.productId,
      originalPrice: product.originalPrice,
      discountedPrice: product.discountedPrice,
      discountPercentage: product.discountPercentage,
      progressPercentage: product.progressPercentage,
      couponCode: product.couponCode,
      couponDescription: product.couponDescription,
      isEnabled: product.isEnabled,
      startDate: new Date(product.displayDuration.startDate)
        .toISOString()
        .split("T")[0],
      endDate: new Date(product.displayDuration.endDate)
        .toISOString()
        .split("T")[0],
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hot product?")) {
      return;
    }

    try {
      await api.delete(`/hot-product/admin/${id}`);
      toast.success("Hot product deleted successfully");
      fetchHotProducts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete hot product"));
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/hot-product/admin/${id}/toggle`);
      toast.success("Status updated successfully");
      fetchHotProducts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
    }
  };

  const handleCancel = () => {
    setFormData(createEmptyForm());
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hot Product</h1>
              <p className="text-gray-600 mt-1">Manage featured hot offers</p>
            </div>
            <Link href="/admin" className="text-[#7A3511] hover:text-[#5A260F]">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedProduct ? "Edit Hot Product" : "Create Hot Product"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product *
                  </label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Original Price *
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                    required
                  />
                </div>

                {/* Discounted Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discounted Price *
                  </label>
                  <input
                    type="number"
                    name="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                    required
                  />
                  <button
                    type="button"
                    onClick={calculateDiscount}
                    className="text-xs text-[#7A3511] hover:text-[#5A260F] mt-2"
                  >
                    Calculate discount %
                  </button>
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="1"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                  />
                </div>

                {/* Progress Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Progress Bar (%)
                  </label>
                  <input
                    type="number"
                    name="progressPercentage"
                    value={formData.progressPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="1"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                  />
                </div>

                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="e.g., STYLE25"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                  />
                </div>

                {/* Coupon Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Coupon Description
                  </label>
                  <textarea
                    name="couponDescription"
                    value={formData.couponDescription}
                    onChange={handleInputChange}
                    placeholder="e.g., Extra discount for your first purchase"
                    rows={2}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                  />
                </div>

                {/* Display Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                  />
                </div>

                {/* Display End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#7A3511] focus:border-[#7A3511]"
                  />
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isEnabled"
                    checked={formData.isEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-[#7A3511] focus:ring-[#7A3511] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Enable this hot product
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#7A3511] text-white py-2 rounded-lg hover:bg-[#5A260F] disabled:bg-gray-400"
                  >
                    {submitting
                      ? "Processing..."
                      : selectedProduct
                        ? "Update"
                        : "Create"}
                  </button>
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Hot Products List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Hot Products
                </h2>
              </div>

              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : hotProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hot products created yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {hotProducts.map((product) => (
                    <div
                      key={product._id}
                      className="p-6 hover:bg-[#FDFBF7] transition"
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <Image
                            src={resolveApiAssetUrl(product.productImage)}
                            alt={product.productName}
                            width={80}
                            height={100}
                            className="object-cover rounded-lg"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {product.productName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            ₹{product.originalPrice} →{" "}
                            <span className="text-green-600 font-semibold">
                              ₹{product.discountedPrice}
                            </span>{" "}
                            ({product.discountPercentage}% off)
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Progress: {product.progressPercentage}% | Coupon:{" "}
                            {product.couponCode}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              product.displayDuration.startDate,
                            ).toLocaleDateString()}{" "}
                            to{" "}
                            {new Date(
                              product.displayDuration.endDate,
                            ).toLocaleDateString()}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                product.isEnabled
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.isEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-4 py-2 bg-[#7A3511]/10 text-[#7A3511] rounded hover:bg-[#7A3511]/20 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product._id)}
                            className="px-4 py-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 text-sm"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
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
      </div>
    </div>
  );
}
