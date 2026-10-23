"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { blogAPI } from "@/lib/blog";
import { resolveApiAssetUrl } from "@/lib/api";
import { IBlog, IBlogContent } from "@/types/blog";
import Image from "@/components/ui/AppImage";
import { X, Plus, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function BlogEditor() {
  const router = useRouter();
  const params = useParams();
  const isEditing = params?.id ? true : false;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: [] as IBlogContent[],
    category: "general",
    tags: [] as string[],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    internalLinks: [] as Array<{ url: string; text: string }>,
    imageAlt: "",
  });

  const [files, setFiles] = useState<{
    featured?: File;
  }>({});
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const fetchBlog = useCallback(
    async (id: string) => {
      try {
        const res = await blogAPI.getBlogForEdit(id);
        const blog = res.data.blog;
        setFormData({
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          category: blog.category,
          tags: blog.tags,
          seoTitle: blog.seoTitle,
          seoDescription: blog.seoDescription,
          seoKeywords: blog.seoKeywords,
          internalLinks: blog.internalLinks,
          imageAlt: blog.imageAlt,
        });
        setPreviewImage(resolveApiAssetUrl(blog.featuredImage));
      } catch (error) {
        console.error("Error fetching blog:", error);
        alert("Failed to load blog");
        router.push("/admin/blogs");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (isEditing && params?.id) {
      // Data fetch on mount; fetchBlog sets its own loading flag.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBlog(params.id as string);
    }
  }, [isEditing, params?.id, fetchBlog]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles({ ...files, featured: file });
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInlineImageUpload = async (
    index: number,
    file?: File,
  ) => {
    if (!file) return;
    setUploadingIndex(index);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      const res = await blogAPI.uploadBlogImage(formDataToSend);
      const url = res.data?.url;
      if (url) {
        updateContentBlock(index, { value: url });
        toast.success("Image uploaded");
      } else {
        toast.error("Image upload failed");
      }
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setUploadingIndex(null);
    }
  };

  const addContentBlock = (type: IBlogContent["type"]) => {
    const newBlock: IBlogContent = {
      type,
      value: "",
    };

    if (type === "heading") {
      newBlock.heading = { level: "h2", text: "" };
    } else if (type === "image") {
      newBlock.imageAlt = "";
    } else if (type === "list") {
      newBlock.isList = true;
      newBlock.listItems = [];
    }

    setFormData({
      ...formData,
      content: [...formData.content, newBlock],
    });
  };

  const updateContentBlock = (index: number, updates: Partial<IBlogContent>) => {
    const newContent = [...formData.content];
    newContent[index] = { ...newContent[index], ...updates };
    setFormData({ ...formData, content: newContent });
  };

  const removeContentBlock = (index: number) => {
    setFormData({
      ...formData,
      content: formData.content.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("slug", formData.slug);
      formDataToSend.append("excerpt", formData.excerpt);
      formDataToSend.append("content", JSON.stringify(formData.content));
      formDataToSend.append("category", formData.category);
      formDataToSend.append("tags", JSON.stringify(formData.tags));
      formDataToSend.append("seoTitle", formData.seoTitle);
      formDataToSend.append("seoDescription", formData.seoDescription);
      formDataToSend.append(
        "seoKeywords",
        JSON.stringify(formData.seoKeywords),
      );
      formDataToSend.append("imageAlt", formData.imageAlt);
      formDataToSend.append(
        "internalLinks",
        JSON.stringify(formData.internalLinks),
      );

      if (files.featured) {
        formDataToSend.append("file", files.featured);
      }

      if (isEditing && params?.id) {
        await blogAPI.updateBlog(params.id as string, formDataToSend);
        alert("Blog updated successfully!");
      } else {
        await blogAPI.createBlog(formDataToSend);
        alert("Blog created successfully!");
      }

      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error saving blog:", error);
      alert("Failed to save blog");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              URL Slug (auto-generated, editable)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              required
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="bras">Bras</option>
                <option value="lingerie">Lingerie</option>
                <option value="bridal">Bridal</option>
                <option value="sleepwear">Sleepwear</option>
                <option value="shapewear">Shapewear</option>
                <option value="style-guide">Style Guide</option>
                <option value="fabric-care">Fabric Care</option>
                <option value="testimonials">Testimonials</option>
                <option value="news">News</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t),
                  })
                }
                placeholder="bras, fit-guide, tips"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Featured Image</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {previewImage && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Image Alt Text
            </label>
            <input
              type="text"
              value={formData.imageAlt}
              onChange={(e) =>
                setFormData({ ...formData, imageAlt: e.target.value })
              }
              required
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Blog Content</h2>

        <div className="space-y-4 mb-6">
          {formData.content.length === 0 && (
            <p className="text-black text-center py-8">
              No content blocks added yet. Click below to add your first block!
            </p>
          )}

          {formData.content.map((block, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-black">
                  {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block
                </span>
                <button
                  type="button"
                  onClick={() => removeContentBlock(index)}
                  className="text-black hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {block.type === "heading" && (
                <div className="space-y-2">
                  <select
                    value={block.heading?.level || "h2"}
                    onChange={(e) =>
                      updateContentBlock(index, {
                        heading: {
                          level: e.target.value as "h1" | "h2" | "h3",
                          text: block.heading?.text || "",
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="h1">Heading 1 (H1)</option>
                    <option value="h2">Heading 2 (H2)</option>
                    <option value="h3">Heading 3 (H3)</option>
                  </select>
                  <input
                    type="text"
                    value={block.heading?.text || ""}
                    onChange={(e) =>
                      updateContentBlock(index, {
                        heading: {
                          level: block.heading?.level || "h2",
                          text: e.target.value,
                        },
                      })
                    }
                    placeholder="Heading text"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              )}

              {block.type === "text" && (
                <textarea
                  value={block.value || ""}
                  onChange={(e) =>
                    updateContentBlock(index, { value: e.target.value })
                  }
                  placeholder="Enter text (supports markdown links: [text](url))"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              )}

              {block.type === "image" && (
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="text-sm font-medium text-black">
                      Upload image
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {uploadingIndex === index ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleInlineImageUpload(index, e.target.files?.[0])
                        }
                        disabled={uploadingIndex === index}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={block.value || ""}
                    onChange={(e) =>
                      updateContentBlock(index, { value: e.target.value })
                    }
                    placeholder="Image URL (auto-filled after upload)"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={block.imageAlt || ""}
                    onChange={(e) =>
                      updateContentBlock(index, { imageAlt: e.target.value })
                    }
                    placeholder="Alt text for image"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              )}

              {block.type === "list" && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.isList ?? true}
                      onChange={(e) =>
                        updateContentBlock(index, { isList: e.target.checked })
                      }
                    />
                    <span>Bullet list (uncheck for numbered list)</span>
                  </label>
                  <textarea
                    value={(block.listItems || []).join("\n")}
                    onChange={(e) =>
                      updateContentBlock(index, {
                        listItems: e.target.value
                          .split("\n")
                          .filter((item) => item.trim()),
                      })
                    }
                    placeholder="Enter list items (one per line)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addContentBlock("text")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Text
          </button>
          <button
            type="button"
            onClick={() => addContentBlock("heading")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Heading
          </button>
          <button
            type="button"
            onClick={() => addContentBlock("image")}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Image
          </button>
          <button
            type="button"
            onClick={() => addContentBlock("list")}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add List
          </button>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">SEO Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              SEO Title
            </label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) =>
                setFormData({ ...formData, seoTitle: e.target.value })
              }
              required
              maxLength={60}
              placeholder="Keep under 60 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-black mt-1">
              {formData.seoTitle.length}/60 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Meta Description
            </label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) =>
                setFormData({ ...formData, seoDescription: e.target.value })
              }
              required
              maxLength={160}
              rows={3}
              placeholder="Keep under 160 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-black mt-1">
              {formData.seoDescription.length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              SEO Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={formData.seoKeywords.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  seoKeywords: e.target.value
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k),
                })
              }
              placeholder="keyword1, keyword2, keyword3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4 sticky bottom-0 bg-white p-4 rounded-lg shadow-lg">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Blog"
              : "Create Blog"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blogs")}
          className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
