export interface MainCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
  mainCategory?: MainCategory | string | null;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
  category: Category;
}

export interface HierarchyCategory extends Category {
  subcategories: Subcategory[];
}

export interface HierarchyMainCategory extends MainCategory {
  categories: HierarchyCategory[];
}

export const getEntityId = (
  value?: string | { _id?: string } | null,
): string => {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || "";
};

export const getEntityName = (
  value?: string | { name?: string } | null,
): string => {
  if (!value) return "";
  return typeof value === "string" ? value : value.name || "";
};

export const getMainCategoryId = (category?: Category | null): string =>
  getEntityId(category?.mainCategory);

export const getMainCategoryName = (category?: Category | null): string =>
  getEntityName(category?.mainCategory);

export const filterCategoriesByMainCategory = (
  categories: Category[],
  mainCategoryId: string,
): Category[] => {
  if (!mainCategoryId) return [];
  return categories.filter(
    (category) => getMainCategoryId(category) === mainCategoryId,
  );
};

export const filterSubcategoriesByCategory = (
  subcategories: Subcategory[],
  categoryId: string,
): Subcategory[] => {
  if (!categoryId) return [];
  return subcategories.filter(
    (subcategory) => getEntityId(subcategory.category) === categoryId,
  );
};
