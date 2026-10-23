"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import api, { resolveApiAssetUrl } from "@/lib/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import type { Category, MainCategory, Subcategory } from "@/lib/catalog";
import {
  filterCategoriesByMainCategory,
  filterSubcategoriesByCategory,
  getMainCategoryId,
} from "@/lib/catalog";

interface ProductForm {
  mainCategory: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory: string;
  flavor: string;
  brand: string;
  gender: string;
  fabric: string;
  fit: string;
  material: string;
  pattern: string;
  color: string;
  sizes: string[];
  careInstructions: string[];
  highlights: string[];
  occasion: string[];
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string[];
  weightKg: string;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  images: string[];
  basePrice: number;
  discountPrice: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  ingredients: string[];
  nutritionalInfo: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  tags: string[];
  variants: Array<{
    id: string;
    label: string;
    price: number;
    stock: number;
  }>;
}

interface ImageFile {
  file: File;
  preview: string;
  uploading: boolean;
}

type ProductFormValue = ProductForm[keyof ProductForm];

export default function AddProductPage() {
  const { checkAuth } = useAuthStore();
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const isUploadingImages = false;
  const router = useRouter();

  const [formData, setFormData] = useState<ProductForm>({
    mainCategory: "",
    name: "",
    shortDescription: "",
    description: "",
    category: "",
    subcategory: "",
    flavor: "",
    brand: "",
    gender: "",
    fabric: "",
    fit: "",
    material: "",
    pattern: "",
    color: "",
    sizes: [],
    careInstructions: [],
    highlights: [],
    occasion: [],
    seoTitle: "",
    seoDescription: "",
    metaKeywords: [],
    weightKg: "",
    lengthCm: "",
    breadthCm: "",
    heightCm: "",
    images: [],
    basePrice: 0,
    discountPrice: 0,
    isBestSeller: false,
    isFeatured: false,
    ingredients: [],
    nutritionalInfo: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    },
    tags: [],
    variants: [{ id: "1", label: "", price: 0, stock: 0 }],
  });
  const [tagsInput, setTagsInput] = useState("");
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [careInstructionsInput, setCareInstructionsInput] = useState("");
  const [highlightsInput, setHighlightsInput] = useState("");
  const [occasionInput, setOccasionInput] = useState("");
  const [metaKeywordsInput, setMetaKeywordsInput] = useState("");

  const fetchCategoriesAndSubcategories = async () => {
    try {
      const [mainCategoriesRes, categoriesRes, subcategoriesRes] =
        await Promise.all([
          api.get("/main-categories"),
          api.get("/categories"),
          api.get("/subcategories"),
        ]);
      setMainCategories(
        mainCategoriesRes.data.mainCategories || mainCategoriesRes.data,
      );
      setCategories(categoriesRes.data.categories || categoriesRes.data);
      setSubcategories(
        subcategoriesRes.data.subcategories || subcategoriesRes.data,
      );
    } catch (error) {
      console.warn("Error fetching data:", error);
      toast.error("Failed to load categories and subcategories");
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }

      // Wait a bit for the user state to update
      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role || "")) {
          router.push("/");
          return;
        }
        await fetchCategoriesAndSubcategories();
        setIsLoading(false);
      }, 100);
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth, router]);

  // Each of these re-syncs its comma-separated text field whenever the
  // underlying array changes from an external source (e.g. the onBlur
  // re-parse below normalizing spacing) — intentional, not a pure local
  // state mirror, so left as effects rather than render-phase adjustments.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTagsInput(formData.tags.join(", "));
  }, [formData.tags]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIngredientsInput(formData.ingredients.join(", "));
  }, [formData.ingredients]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizesInput(formData.sizes.join(", "));
  }, [formData.sizes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCareInstructionsInput(formData.careInstructions.join(", "));
  }, [formData.careInstructions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightsInput(formData.highlights.join(", "));
  }, [formData.highlights]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOccasionInput(formData.occasion.join(", "));
  }, [formData.occasion]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMetaKeywordsInput(formData.metaKeywords.join(", "));
  }, [formData.metaKeywords]);

  const handleMainCategoryChange = (mainCategoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      mainCategory: mainCategoryId,
      category: "",
      subcategory: "",
    }));
    setFilteredCategories(
      filterCategoriesByMainCategory(categories, mainCategoryId),
    );
    setFilteredSubcategories([]);
  };

  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find(
      (category) => category._id === categoryId,
    );
    setFormData((prev) => ({
      ...prev,
      mainCategory: selectedCategory ? getMainCategoryId(selectedCategory) : "",
      category: categoryId,
      subcategory: "",
    }));
    setFilteredSubcategories(
      filterSubcategoriesByCategory(subcategories, categoryId),
    );
  };

  const handleInputChange = (field: keyof ProductForm, value: ProductFormValue) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNutritionalInfoChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      nutritionalInfo: { ...prev.nutritionalInfo, [field]: value },
    }));
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const addVariant = () => {
    const newVariant = {
      id: (formData.variants.length + 1).toString(),
      label: "",
      price: 0,
      stock: 0,
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }));
    }
  };
  // Image upload functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImageFiles: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newImageFiles.push({
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
        });
      }
    }

    setImageFiles((prev) => [...prev, ...newImageFiles]);
  };

  const removeImage = (previewUrl: string) => {
    setImageFiles((prev) => {
      const filtered = prev.filter((img) => img.preview !== previewUrl);
      // Clean up object URL
      const removed = prev.find((img) => img.preview === previewUrl);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImageFiles((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedTags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      const tagsToSend =
        parsedTags.length > 0 || tagsInput.trim().length > 0
          ? parsedTags
          : formData.tags;
      const parsedIngredients = ingredientsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      const ingredientsToSend =
        parsedIngredients.length > 0 || ingredientsInput.trim().length > 0
          ? parsedIngredients
          : formData.ingredients;

      const parsedSizes = sizesInput
        .split(",")
        .map((size) => size.trim())
        .filter((size) => size);
      const sizesToSend =
        parsedSizes.length > 0 || sizesInput.trim().length > 0
          ? parsedSizes
          : formData.sizes;

      const parsedCareInstructions = careInstructionsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      const careInstructionsToSend =
        parsedCareInstructions.length > 0 || careInstructionsInput.trim().length > 0
          ? parsedCareInstructions
          : formData.careInstructions;

      const parsedHighlights = highlightsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      const highlightsToSend =
        parsedHighlights.length > 0 || highlightsInput.trim().length > 0
          ? parsedHighlights
          : formData.highlights;

      const parsedOccasion = occasionInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      const occasionToSend =
        parsedOccasion.length > 0 || occasionInput.trim().length > 0
          ? parsedOccasion
          : formData.occasion;

      const parsedMetaKeywords = metaKeywordsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      const metaKeywordsToSend =
        parsedMetaKeywords.length > 0 || metaKeywordsInput.trim().length > 0
          ? parsedMetaKeywords
          : formData.metaKeywords;

      const shippingValues = [
        formData.weightKg,
        formData.lengthCm,
        formData.breadthCm,
        formData.heightCm,
      ].map((value) => value.trim());
      const filledShipping = shippingValues.filter((value) => value !== "");
      if (filledShipping.length > 0 && filledShipping.length < 4) {
        toast.error(
          "Enter weight and all dimensions for shippable products (or leave all shipping fields blank).",
        );
        setIsSubmitting(false);
        return;
      }
      const invalidShipping = filledShipping.some((value) => {
        const parsed = Number(value);
        return !Number.isFinite(parsed) || parsed <= 0;
      });
      if (invalidShipping) {
        toast.error("Shipping values must be positive numbers.");
        setIsSubmitting(false);
        return;
      }

      // Create FormData to send both product data and images
      const formDataToSend = new FormData();

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Add all product fields as individual form fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("mainCategory", formData.mainCategory);
      formDataToSend.append("shortDescription", formData.shortDescription);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("subcategory", formData.subcategory);
      // The deployed backend still requires `flavor` (a leftover "Collection
      // / Look" field from before this catalog moved to fashion/lingerie).
      // Most products never set it, so fall back to the product's own
      // category/brand rather than block the save on an empty string.
      const selectedCategoryForFlavor = categories.find(
        (category) => category._id === formData.category,
      );
      const flavorFallback =
        selectedCategoryForFlavor?.name || formData.brand.trim() || formData.name.trim();
      formDataToSend.append("flavor", formData.flavor.trim() || flavorFallback);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("fabric", formData.fabric);
      formDataToSend.append("fit", formData.fit);
      formDataToSend.append("material", formData.material);
      formDataToSend.append("pattern", formData.pattern);
      formDataToSend.append("color", formData.color);
      formDataToSend.append("seoTitle", formData.seoTitle);
      formDataToSend.append("seoDescription", formData.seoDescription);
      formDataToSend.append("weightKg", formData.weightKg);
      formDataToSend.append("lengthCm", formData.lengthCm);
      formDataToSend.append("breadthCm", formData.breadthCm);
      formDataToSend.append("heightCm", formData.heightCm);
      formDataToSend.append("slug", slug);
      formDataToSend.append("id", slug);
      formDataToSend.append("basePrice", formData.basePrice.toString());
      formDataToSend.append("discountPrice", formData.discountPrice.toString());
      formDataToSend.append("isBestSeller", formData.isBestSeller.toString());
      formDataToSend.append("isFeatured", formData.isFeatured.toString());

      // Add complex fields as JSON strings
      formDataToSend.append(
        "nutritionalInfo",
        JSON.stringify(formData.nutritionalInfo),
      );
      formDataToSend.append("variants", JSON.stringify(formData.variants));
      formDataToSend.append(
        "ingredients",
        JSON.stringify(ingredientsToSend),
      );
      formDataToSend.append("tags", JSON.stringify(tagsToSend));
      formDataToSend.append("sizes", JSON.stringify(sizesToSend));
      formDataToSend.append(
        "careInstructions",
        JSON.stringify(careInstructionsToSend),
      );
      formDataToSend.append("highlights", JSON.stringify(highlightsToSend));
      formDataToSend.append("occasion", JSON.stringify(occasionToSend));
      formDataToSend.append(
        "metaKeywords",
        JSON.stringify(metaKeywordsToSend),
      );

      // Add image files
      imageFiles.forEach((imageFile) => {
        formDataToSend.append("images", imageFile.file);
      });

      // Send to backend
      await api.post("/products", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product added successfully");
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch((revalidateError) => {
        console.error("Failed to revalidate storefront cache:", revalidateError);
      });
      router.push("/admin/products");
    } catch (error: unknown) {
      // The API error is already surfaced to the user via toast below;
      // console.error here would trip the Next.js dev overlay's issue
      // count for what is usually just a validation failure, not a crash.
      console.warn("Error adding product:", error);
      toast.error(getApiErrorMessage(error, "Failed to add product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1B2E27]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Add New Product</h1>
          <p className="mt-2 text-black">
            Create a new product for your store
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 space-y-6"
        >
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                placeholder="Denimique"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Collection / Look
              </label>
              <input
                type="text"
                value={formData.flavor}
                onChange={(e) => handleInputChange("flavor", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                placeholder="e.g., Autumn Edit, Ivory Luxe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
              >
                <option value="">Select gender</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Fabric</label>
              <input value={formData.fabric} onChange={(e) => handleInputChange("fabric", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Cotton" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Fit</label>
              <input value={formData.fit} onChange={(e) => handleInputChange("fit", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Regular fit" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Material</label>
              <input value={formData.material} onChange={(e) => handleInputChange("material", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Silk blend" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Pattern</label>
              <input value={formData.pattern} onChange={(e) => handleInputChange("pattern", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Solid / Printed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Color</label>
              <input value={formData.color} onChange={(e) => handleInputChange("color", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Ivory" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Short Description *
            </label>
            <input
              type="text"
              required
              value={formData.shortDescription}
              onChange={(e) =>
                handleInputChange("shortDescription", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
              placeholder="Brief description of the product"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
              placeholder="Detailed description of the product"
            />
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Main Category *
              </label>
              <select
                required
                value={formData.mainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
              >
                <option value="">Select Main Category</option>
                {mainCategories.map((mainCategory) => (
                  <option key={mainCategory._id} value={mainCategory._id}>
                    {mainCategory.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                disabled={!formData.mainCategory}
              >
                <option value="">Select Category</option>
                {filteredCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) =>
                  handleInputChange("subcategory", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                disabled={!formData.category || filteredSubcategories.length === 0}
              >
                <option value="">
                  {formData.category && filteredSubcategories.length === 0
                    ? "No subcategories"
                    : "Select Subcategory"}
                </option>
                {filteredSubcategories.map((subcategory) => (
                  <option key={subcategory._id} value={subcategory._id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Base Price (₹) *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.basePrice === 0 ? "" : formData.basePrice}
                  onChange={(e) =>
                    handleInputChange(
                      "basePrice",
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                    )
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Discount Price (₹)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountPrice === 0 ? "" : formData.discountPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "discountPrice",
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                    )
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-medium text-black">
                Shipping Details
              </h3>
              <p className="text-xs text-black max-w-xs text-right">
                Required for shippable products. Leave all fields blank for
                digital or service items.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.weightKg}
                  onChange={(e) =>
                    handleInputChange("weightKg", e.target.value)
                  }
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="e.g., 0.5"
                />
                <span className="pointer-events-none absolute right-3 top-[calc(50%+18px)] -translate-y-1/2 text-xs text-black">
                  kg
                </span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">
                  Length (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.lengthCm}
                  onChange={(e) =>
                    handleInputChange("lengthCm", e.target.value)
                  }
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="e.g., 20"
                />
                <span className="pointer-events-none absolute right-3 top-[calc(50%+18px)] -translate-y-1/2 text-xs text-black">
                  cm
                </span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">
                  Breadth (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.breadthCm}
                  onChange={(e) =>
                    handleInputChange("breadthCm", e.target.value)
                  }
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="e.g., 15"
                />
                <span className="pointer-events-none absolute right-3 top-[calc(50%+18px)] -translate-y-1/2 text-xs text-black">
                  cm
                </span>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.heightCm}
                  onChange={(e) =>
                    handleInputChange("heightCm", e.target.value)
                  }
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="e.g., 10"
                />
                <span className="pointer-events-none absolute right-3 top-[calc(50%+18px)] -translate-y-1/2 text-xs text-black">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) =>
                  handleInputChange("isBestSeller", e.target.checked)
                }
                className="rounded border-gray-300 text-black focus:ring-[#1B2E27]"
              />
              <span className="ml-2 text-sm text-black">Best Seller</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  handleInputChange("isFeatured", e.target.checked)
                }
                className="rounded border-gray-300 text-black focus:ring-[#1B2E27]"
              />
              <span className="ml-2 text-sm text-black">Featured</span>
            </label>
          </div>

          {/* Product Details */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Key Details (comma-separated)
            </label>
            <input
              type="text"
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              onBlur={() =>
                handleInputChange(
                  "ingredients",
                  ingredientsInput
                    .split(",")
                    .map((item) => item.trim())
                    .filter((item) => item),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
              placeholder="e.g., Premium weave, festive-ready, reversible"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onBlur={() =>
                handleInputChange(
                  "tags",
                  tagsInput
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
              placeholder="e.g., festive, premium, new-arrival"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Available Sizes</label>
              <input type="text" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} onBlur={() => handleInputChange("sizes", sizesInput.split(",").map((item) => item.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="XS, S, M, L, XL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Occasions</label>
              <input type="text" value={occasionInput} onChange={(e) => setOccasionInput(e.target.value)} onBlur={() => handleInputChange("occasion", occasionInput.split(",").map((item) => item.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Wedding, Festive, Casual" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Care Instructions</label>
              <input type="text" value={careInstructionsInput} onChange={(e) => setCareInstructionsInput(e.target.value)} onBlur={() => handleInputChange("careInstructions", careInstructionsInput.split(",").map((item) => item.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Dry clean, hand wash" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Meta Keywords</label>
              <input type="text" value={metaKeywordsInput} onChange={(e) => setMetaKeywordsInput(e.target.value)} onBlur={() => handleInputChange("metaKeywords", metaKeywordsInput.split(",").map((item) => item.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="designer, festive wear, premium" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Highlights</label>
            <input type="text" value={highlightsInput} onChange={(e) => setHighlightsInput(e.target.value)} onBlur={() => handleInputChange("highlights", highlightsInput.split(",").map((item) => item.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Premium fabric, embroidered detail, limited edition" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">SEO Title</label>
              <input type="text" value={formData.seoTitle} onChange={(e) => handleInputChange("seoTitle", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Elegant Ivory Kurta for Festive Wear" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">SEO Description</label>
              <textarea rows={2} value={formData.seoDescription} onChange={(e) => handleInputChange("seoDescription", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]" placeholder="Premium festive kurta with breathable fabric and modern silhouette." />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              >
                Add Variant
              </button>
            </div>

            {formData.variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-md"
              >
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.label}
                    onChange={(e) =>
                      handleVariantChange(index, "label", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                    placeholder="e.g., 50g, 100g"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={variant.price === 0 ? "" : variant.price}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "price",
                          e.target.value === "" ? 0 : parseFloat(e.target.value),
                        )
                      }
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Stock *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={variant.stock === 0 ? "" : variant.stock}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "stock",
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2E27]"
                  />
                </div>

                {formData.variants.length > 1 && (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4">
              Product Images
            </h3>

            {/* Image Upload Area */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Upload Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploadingImages}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-12 h-12 text-black mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-black mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-black">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </label>
              </div>
            </div>

            {/* Image Previews */}
            {imageFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-black mb-2">
                  Selected Images ({imageFiles.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((imageFile, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageFile.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      {imageFile.uploading && (
                        <div className="absolute inset-0 bg-[#1B2E27] bg-opacity-50 rounded-md flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(imageFile.preview)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={imageFile.uploading}
                      >
                        ×
                      </button>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveImage(index, index - 1)}
                          disabled={index === 0}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          Left
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, index + 1)}
                          disabled={index === imageFiles.length - 1}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Images (if editing) */}
            {formData.images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-black mb-2">
                  Current Images ({formData.images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={resolveApiAssetUrl(imageUrl)}
                        alt={`Current ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index),
                          }));
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href="/admin/products"
              className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#1B2E27] text-white rounded-md hover:bg-[#5A260F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Adding Product..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


