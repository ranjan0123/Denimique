import axios from "axios";
import api, { resolveApiAssetUrl } from "@/lib/api";
import type {
  Category,
  HierarchyMainCategory,
  MainCategory,
  Subcategory,
} from "@/lib/catalog";
import type { Product, ProductVariant } from "@/types/product";

interface ProductApiResponse {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  handle?: string;
  price?: number | string;
  shortDescription?: string;
  description?: string;
  mainCategory?: MainCategory | string | null;
  category?: Category | string | null;
  subcategory?: Subcategory | string | null;
  flavor?: string;
  brand?: string;
  gender?: string;
  fabric?: string;
  fit?: string;
  material?: string;
  pattern?: string;
  color?: string;
  sizes?: string[];
  careInstructions?: string[];
  highlights?: string[];
  occasion?: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  images?: Array<string | { src?: string; url?: string; altText?: string }> | string;
  image?: string | { src?: string; url?: string };
  imageUrl?: string;
  productImage?: string;
  basePrice?: number | string;
  discountPrice?: number | string;
  rating?: number;
  reviewCount?: number;
  variants?: ProductVariant[] | Array<{
    price?: number | string;
    compareAtPrice?: number | string;
    inventoryQty?: number;
    options?: Record<string, string>;
    sku?: string;
  }>;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  ingredients?: string[];
  nutritionalInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  tags?: string[];
  collection?: string;
  createdAt?: string;
}

type CatalogFormFields = Record<string, string | undefined>;

const getImageUrl = (image: unknown): string | undefined => {
  if (typeof image === "string") {
    return image.trim() || undefined;
  }

  if (image && typeof image === "object") {
    const candidate = image as { src?: unknown; url?: unknown };
    const url = candidate.src ?? candidate.url;
    return typeof url === "string" && url.trim() ? url.trim() : undefined;
  }

  return undefined;
};

interface LegacyVariant {
  price?: number | string;
  compareAtPrice?: number | string;
  inventoryQty?: number;
  options?: Record<string, string>;
  sku?: string;
}

const normalizeLegacyVariants = (
  variants: ProductApiResponse["variants"],
): ProductVariant[] => {
  if (!Array.isArray(variants)) return [];

  return (variants as LegacyVariant[]).map((variant, index) => ({
    // Always suffixed with index: Color/sku alone collide whenever a
    // product has multiple variants sharing a color (e.g. same color,
    // different sizes), which was producing duplicate React keys in the
    // variant picker.
    id: `${variant?.sku || variant?.options?.["Color"] || "variant"}-${index}`,
    label: String(variant?.options?.["Color"] || variant?.options?.["Size"] || "Standard"),
    price: Number(variant?.price ?? 0),
    discountPrice: variant?.compareAtPrice
      ? Number(variant.compareAtPrice)
      : undefined,
    stock: Number(variant?.inventoryQty ?? 0),
  }));
};

export const getProductImageSources = (product: {
  images?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  productImage?: unknown;
}): string[] => {
  const images = Array.isArray(product.images)
    ? product.images
    : typeof product.images === "string"
      ? [product.images]
      : [];

  const sources = [
    ...images,
    product.image,
    product.imageUrl,
    product.productImage,
  ]
    .map(getImageUrl)
    .filter((image): image is string => Boolean(image));

  return [...new Set(sources)];
};

const normalizeMainCategory = (
  mainCategory: MainCategory | string | null | undefined,
): MainCategory | string | null | undefined => {
  if (!mainCategory || typeof mainCategory === "string") {
    return mainCategory;
  }

  return {
    ...mainCategory,
    image: resolveApiAssetUrl(mainCategory.image),
  };
};

const createEmptyCategory = (
  mainCategory?: MainCategory | string | null,
): Category => ({
  _id: "",
  name: "",
  slug: "",
  image: "",
  mainCategory: mainCategory || null,
});

const normalizeCategory = (
  category?: Partial<Category> | null,
  fallbackMainCategory?: MainCategory | string | null,
): Category => ({
  ...createEmptyCategory(fallbackMainCategory),
  ...category,
  image: resolveApiAssetUrl(category?.image),
  mainCategory: normalizeMainCategory(
    category?.mainCategory ?? fallbackMainCategory ?? null,
  ),
});

const normalizeSubcategory = (
  subcategory?: Partial<Subcategory> | null,
  fallbackCategory?: Category | string | null,
): Subcategory => ({
  _id: subcategory?._id || "",
  name: subcategory?.name || "",
  slug: subcategory?.slug || "",
  description: subcategory?.description || "",
  createdAt: subcategory?.createdAt,
  image: resolveApiAssetUrl(subcategory?.image),
  category:
    typeof fallbackCategory === "string"
      ? normalizeCategory({ _id: fallbackCategory })
      : normalizeCategory(subcategory?.category ?? fallbackCategory),
});

const ensureCategory = (
  value?: Category | string | null,
  mainCategory?: MainCategory | string | null,
): Category | null => {
  if (!value) return null;
  if (typeof value === "string") {
    return normalizeCategory({ _id: value }, mainCategory);
  }

  return normalizeCategory(value, mainCategory);
};

const ensureSubcategory = (
  value?: Subcategory | string | null,
  fallbackCategory?: Category | string | null,
): Subcategory | null => {
  if (!value) return null;
  if (typeof value === "string") {
    return normalizeSubcategory({ _id: value }, fallbackCategory);
  }

  return normalizeSubcategory(value, fallbackCategory);
};

export const normalizeProduct = (product: ProductApiResponse): Product => {
  const category = ensureCategory(product.category, product.mainCategory);
  const subcategory = ensureSubcategory(product.subcategory, category);
  const id = product.id || product._id || product.slug || product.handle || product.name || product.title || "";
  const normalizedRating = Number(product.rating);
  const normalizedReviewCount = Number(product.reviewCount);
  const productImages = getProductImageSources(product);
  const firstVariantPrice = product.variants?.[0]?.price;
  const normalizedPrice = Number(product.price ?? product.basePrice ?? firstVariantPrice);
  // Was also gated on `!product.slug`, which broke once every legacy
  // product got a real slug backfilled (see scripts/backfill-product-slugs.ts)
  // — `name` is the only field that reliably distinguishes the two shapes:
  // legacy (Shopify-imported) products never have it, native ones always do.
  const isLegacyProduct = Boolean(
    product.title && product.handle && !product.name,
  );

  return {
    _id: product._id,
    id,
    slug: product.slug || product.handle || id,
    name: product.name || product.title || id,
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    mainCategory:
      typeof product.mainCategory === "string" ? null : product.mainCategory || null,
    category: category || {
      _id: product.collection || "legacy",
      name: product.collection || "Legacy Collection",
      slug: product.collection?.toLowerCase().replace(/\s+/g, "-") || "legacy",
      image: "",
      mainCategory: null,
    },
    collection: product.collection || "",
    subcategory,
    flavor: product.flavor || "",
    brand: product.brand || "",
    gender: product.gender || "",
    fabric: product.fabric || "",
    fit: product.fit || "",
    material: product.material || "",
    pattern: product.pattern || "",
    color: product.color || "",
    sizes: product.sizes || [],
    careInstructions: product.careInstructions || [],
    highlights: product.highlights || [],
    occasion: product.occasion || [],
    seoTitle: product.seoTitle || product.title || "",
    seoDescription: product.seoDescription || "",
    metaKeywords: product.metaKeywords || [],
    images: productImages.map(resolveApiAssetUrl),
    basePrice: product.basePrice ? Number(product.basePrice) : Number(product.variants?.[0]?.price || 0),
    price: Number.isFinite(normalizedPrice) ? normalizedPrice : undefined,
    discountPrice: product.discountPrice
      ? Number(product.discountPrice)
      : undefined,
    rating: Number.isFinite(normalizedRating) ? normalizedRating : undefined,
    reviewCount: Number.isFinite(normalizedReviewCount)
      ? normalizedReviewCount
      : undefined,
    variants: isLegacyProduct
      ? normalizeLegacyVariants(product.variants)
      : (product.variants as ProductVariant[] | undefined) || [],
    isBestSeller: product.isBestSeller || false,
    isFeatured: product.isFeatured || false,
    ingredients: product.ingredients || [],
    nutritionalInfo: {
      calories: product.nutritionalInfo?.calories || "",
      protein: product.nutritionalInfo?.protein || "",
      carbs: product.nutritionalInfo?.carbs || "",
      fat: product.nutritionalInfo?.fat || "",
    },
    tags: product.tags || [],
    createdAt: product.createdAt,
  };
};

const normalizeCategorySlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const productMatchesCategory = (
  product: Product,
  categorySlug: string,
): boolean => {
  if (product.category?.slug === categorySlug) return true;

  const productCategorySlugs = [
    normalizeCategorySlug(product.category?.slug || ""),
    normalizeCategorySlug(product.category?.name || ""),
    normalizeCategorySlug(product.collection || ""),
  ].filter(Boolean);

  const categoryWords = categorySlug.split("-");
  const singularCategorySlug = categoryWords
    .map((word) =>
      word.endsWith("ies")
        ? `${word.slice(0, -3)}y`
        : word.endsWith("s") && !word.endsWith("ss")
          ? word.slice(0, -1)
          : word,
    )
    .join("-");
  const categoryAliases = new Set([categorySlug, singularCategorySlug]);

  return [...categoryAliases].some((alias) =>
    productCategorySlugs.some(
      (productSlug) =>
        productSlug === alias ||
        productSlug.endsWith(`-${alias}`) ||
        productSlug.startsWith(`${alias}-`) ||
        productSlug.includes(`-${alias}-`),
    ),
  );
};

type ProductQuery = {
  limit?: number;
  page?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  category?: string;
};

const PRODUCT_CACHE_TTL_MS = 60_000;
const CATEGORY_HIERARCHY_CACHE_TTL_MS = 5 * 60_000;

type ProductCacheEntry = {
  expiresAt: number;
  promise: Promise<Product[]>;
};

type HierarchyCacheEntry = {
  expiresAt: number;
  promise: Promise<HierarchyMainCategory[]>;
};

const productCache = new Map<string, ProductCacheEntry>();
let hierarchyCache: HierarchyCacheEntry | null = null;

const getProductCacheKey = (query: ProductQuery): string =>
  JSON.stringify({
    limit: query.limit ?? null,
    page: query.page ?? null,
    isFeatured: query.isFeatured ?? null,
    isBestSeller: query.isBestSeller ?? null,
    category: query.category ?? null,
  });

export const getProducts = async (query: ProductQuery = {}): Promise<Product[]> => {
  const cacheKey = getProductCacheKey(query);
  const now = Date.now();
  const cached = productCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const requestPromise = api
    .get("/products", {
      params: {
        ...(query.limit ? { limit: query.limit } : {}),
        ...(query.page ? { page: query.page } : {}),
        ...(query.isFeatured ? { isFeatured: "true" } : {}),
        ...(query.isBestSeller ? { isBestSeller: "true" } : {}),
        ...(query.category ? { category: query.category } : {}),
      },
    })
    .then((response) => {
      const products: ProductApiResponse[] =
        response.data.products || response.data || [];
      return products.map(normalizeProduct);
    })
    .catch((error) => {
      productCache.delete(cacheKey);
      throw error;
    });

  productCache.set(cacheKey, {
    expiresAt: now + PRODUCT_CACHE_TTL_MS,
    promise: requestPromise,
  });

  return requestPromise;
};

export const invalidateProductsCache = (): void => {
  productCache.clear();
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return normalizeProduct(response.data.product || response.data);
};

export const getProductBySlug = async (slug: string): Promise<Product> => {
  try {
    const response = await api.get(`/products/slug/${slug}`);
    return normalizeProduct(response.data.product || response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const fallbackResponse = await api.get(`/products/${slug}`);
      return normalizeProduct(fallbackResponse.data.product || fallbackResponse.data);
    }
    throw error;
  }
};

export const getMainCategories = async (): Promise<MainCategory[]> => {
  const response = await api.get("/main-categories");
  const mainCategories: MainCategory[] =
    response.data.mainCategories || response.data || [];
  return mainCategories.map(
    (mainCategory) => normalizeMainCategory(mainCategory) as MainCategory,
  );
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get("/categories");
  const categories: Category[] = response.data.categories || response.data || [];
  return categories.map((category) => normalizeCategory(category));
};

export const getSubcategories = async (): Promise<Subcategory[]> => {
  const response = await api.get("/subcategories");
  const subcategories: Subcategory[] =
    response.data.subcategories || response.data || [];
  return subcategories.map((subcategory) => normalizeSubcategory(subcategory));
};

export const getCategoryHierarchy = async (): Promise<HierarchyMainCategory[]> => {
  const now = Date.now();
  if (hierarchyCache && hierarchyCache.expiresAt > now) {
    return hierarchyCache.promise;
  }

  const requestPromise = api
    .get("/categories/hierarchy")
    .then((response) => {
      const hierarchy: HierarchyMainCategory[] =
        response.data.mainCategories || response.data || [];
      return hierarchy.map((mainCategory) => ({
        ...(normalizeMainCategory(mainCategory) as MainCategory),
        categories: mainCategory.categories.map((category) => ({
          ...normalizeCategory(category),
          subcategories: category.subcategories.map((subcategory) =>
            normalizeSubcategory(subcategory, category),
          ),
        })),
      }));
    })
    .catch((error) => {
      hierarchyCache = null;
      throw error;
    });

  hierarchyCache = {
    expiresAt: now + CATEGORY_HIERARCHY_CACHE_TTL_MS,
    promise: requestPromise,
  };

  return requestPromise;
};

export const getProductPrimaryImage = (product: Product): string =>
  product.images[0] || "";

export const formatProductPrice = (price?: number): string => {
  if (!Number.isFinite(price) || price === undefined) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

export const getProductCategoryName = (product: Product): string =>
  product.category?.name || "Uncategorized";

export const getProductMainCategoryName = (product: Product): string =>
  product.category?.mainCategory && typeof product.category.mainCategory !== "string"
    ? product.category.mainCategory.name
    : product.mainCategory?.name || "";

export const getCatalogImage = (
  entity?: { image?: string } | null,
  fallback = "/images/lates.avif",
): string => {
  if (entity?.image) {
    return resolveApiAssetUrl(entity.image);
  }
  return fallback;
};

export const buildCatalogFormData = (
  fields: CatalogFormFields,
  imageFile?: File | null,
): FormData => {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value);
    }
  });

  if (imageFile) {
    formData.append("image", imageFile);
  }

  return formData;
};



