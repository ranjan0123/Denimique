import api from "@/lib/api";
import { API_BASE_URL } from "./apiConfig";

export const blogAPI = {
  // Public blog endpoints
  getBlogs: (
    page = 1,
    limit = 10,
    filters?: { category?: string; tags?: string; search?: string },
  ) => {
    let url = `${API_BASE_URL}/blogs?page=${page}&limit=${limit}`;
    if (filters?.category) url += `&category=${filters.category}`;
    if (filters?.tags) url += `&tags=${filters.tags}`;
    if (filters?.search) url += `&search=${encodeURIComponent(filters.search)}`;
    return api.get(url);
  },

  getBlogBySlug: (slug: string) =>
    api.get(`${API_BASE_URL}/blogs/${slug}`),

  getBlogById: (id: string) =>
    api.get(`${API_BASE_URL}/blogs/id/${id}`),

  getTrendingBlogs: (limit = 5) =>
    api.get(`${API_BASE_URL}/blogs/trending?limit=${limit}`),

  getCategories: () =>
    api.get(`${API_BASE_URL}/blogs/categories`),

  getAllTags: () =>
    api.get(`${API_BASE_URL}/blogs/tags`),

  // Admin blog endpoints
  
  createBlog: (formData: FormData) =>
    api.post(`${API_BASE_URL}/admin/blogs`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getAllBlogs: (
    page = 1,
    limit = 10,
    filters?: { status?: string; category?: string; search?: string },
  ) => {
    let url = `${API_BASE_URL}/admin/blogs?page=${page}&limit=${limit}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.category) url += `&category=${filters.category}`;
    if (filters?.search) url += `&search=${encodeURIComponent(filters.search)}`;
    return api.get(url);
  },

  getBlogForEdit: (id: string) =>
    api.get(`${API_BASE_URL}/admin/blogs/${id}`),

  updateBlog: (id: string, formData: FormData) =>
    api.put(`${API_BASE_URL}/admin/blogs/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteBlog: (id: string) =>
    api.delete(`${API_BASE_URL}/admin/blogs/${id}`),

  publishBlog: (id: string, isPublished: boolean) =>
    api.patch(
      `${API_BASE_URL}/admin/blogs/${id}/publish`,
      { isPublished },
    ),

  getBlogAnalytics: () =>
    api.get(`${API_BASE_URL}/admin/blogs/analytics`),

  uploadBlogImage: (formData: FormData) =>
    api.post(`${API_BASE_URL}/admin/blogs/upload-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
