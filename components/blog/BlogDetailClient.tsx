"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { blogAPI } from "@/lib/blog";
import api, { getApiErrorMessage, resolveApiAssetUrl } from "@/lib/api";
import toast from "react-hot-toast";
import { IBlog } from "@/types/blog";
import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import BlogCard from "@/components/blog/BlogCard";
import {
  Calendar,
  User,
  Eye,
  Share2,
  Clock,
  ChevronLeft,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Check,
} from "lucide-react";

export default function BlogDetailClient() {
  const params = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<IBlog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<IBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [submittingSubscribe, setSubmittingSubscribe] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      
      const article = articleRef.current;
      const { top, height } = article.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      const articleTop = scrollPosition + top;
      const articleBottom = articleTop + height;
      const viewportBottom = scrollPosition + windowHeight;
      
      if (viewportBottom <= articleTop) {
        setReadingProgress(0);
      } else if (scrollPosition >= articleBottom - windowHeight) {
        setReadingProgress(100);
      } else {
        const progress = ((scrollPosition - articleTop + windowHeight) / (height + windowHeight)) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const estimatedReadTime = blog?.content
    ? Math.ceil(blog.content.length / 200) || 1
    : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!params?.slug) return;

    const fetchBlog = async () => {
      try {
        const res = await blogAPI.getBlogBySlug(params.slug);
        setBlog(res.data.blog);
        setRelatedBlogs(res.data.relatedBlogs || []);
      } catch (error) {
        console.error("Error fetching blog:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [params.slug]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail) {
      toast.error("Please enter your email.");
      return;
    }
    try {
      setSubmittingSubscribe(true);
      await api.post("/forms/blog-subscribe", {
        email: subscriberEmail,
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      toast.success("Subscribed successfully.");
      setSubscriberEmail("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to subscribe."));
    } finally {
      setSubmittingSubscribe(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F3]">
        <div className="relative w-full h-96 bg-gray-200 animate-pulse" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse mb-6" />
            
            <div className="flex gap-4 mb-8">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return notFound();
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const formattedDate = formatDate(blog.createdAt);

  return (
    <>
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#936965] to-[#7A3511] z-50 transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />

      <nav className="lg:hidden fixed top-4 left-4 z-50">
        <Link
          href="/blog"
          className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Back to Blog"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </nav>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <div className="relative" ref={shareMenuRef}>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="group relative flex items-center justify-center w-12 h-12 bg-[#7A3511] text-white rounded-full shadow-lg hover:bg-[#1C3A2E] transition-all duration-300 hover:scale-110"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
          </button>

          {showShareMenu && (
            <div className="absolute bottom-full right-0 mb-3 bg-white rounded-xl shadow-xl p-2 min-w-[200px] animate-in slide-in-from-bottom-2">
              <button
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <Facebook className="w-5 h-5 text-[#7A3511]" />
                <span className="flex-1">Facebook</span>
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Share</span>
              </button>
              
              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(blog.title)}`, '_blank');
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
                <span className="flex-1">Twitter</span>
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Tweet</span>
              </button>
              
              <button
                onClick={() => {
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <Linkedin className="w-5 h-5 text-[#7A3511]" />
                <span className="flex-1">LinkedIn</span>
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Share</span>
              </button>
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="flex-1 text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5 text-gray-600" />
                    <span className="flex-1">Copy link</span>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <article ref={articleRef} className="min-h-screen bg-[#FAF7F3]">
        <div className="relative w-full min-h-[70vh] bg-gradient-to-br from-[#5A260F] to-[#7A3511] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={resolveApiAssetUrl(blog.featuredImage)}
              alt={blog.imageAlt || blog.title}
              fill
              className={`object-cover transition-opacity duration-1000 ${
                imageLoaded ? "opacity-40" : "opacity-0"
              }`}
              priority
              onLoadingComplete={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#7A3511] via-[#7A3511]/70 to-transparent" />
          </div>

          <div className="relative h-full flex items-end">
            <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
              <nav className="flex items-center gap-2 text-sm text-gray-300 mb-6">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
                <span>/</span>
                <span className="text-white truncate">{blog.title}</span>
              </nav>

              <div className="inline-block bg-[#7A3511] text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 hover:bg-[#1C3A2E] transition-colors cursor-pointer">
                {blog.category}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A3511] to-[#1C3A2E] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-400">Author</span>
                    <span className="font-medium">{blog.author.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <span className="block text-sm text-gray-400">Published</span>
                    <span className="font-medium">{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <div>
                    <span className="block text-sm text-gray-400">Read time</span>
                    <span className="font-medium">{estimatedReadTime} min read</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <div>
                    <span className="block text-sm text-gray-400">Views</span>
                    <span className="font-medium">{blog.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {showTableOfContents && (
              <div className="p-6 bg-[#FAF7F3] border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
                <nav className="space-y-2">
                  <Link href="#section-1" className="block text-[#7A3511] hover:text-[#1C3A2E]">
                    Introduction
                  </Link>
                  <Link href="#section-2" className="block text-[#7A3511] hover:text-[#1C3A2E]">
                    Key Points
                  </Link>
                  <Link href="#section-3" className="block text-[#7A3511] hover:text-[#1C3A2E]">
                    Conclusion
                  </Link>
                </nav>
              </div>
            )}

            <div className="p-8 md:p-12">
              <div className="mb-8 pb-8 border-b border-gray-200">
                <p className="text-xl text-gray-700 leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tags=${tag}`}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 hover:text-gray-900 transition-all hover:scale-105"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

              <div ref={contentRef} className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-[#7A3511] prose-img:rounded-xl">
                <BlogContentRenderer
                  content={blog.content}
                  internalLinks={blog.internalLinks}
                />
              </div>

              <div className="mt-10 rounded-2xl border border-[#7A3511]/15 bg-gradient-to-r from-[#7A3511]/12 via-[#F6F1EC] to-[#F4B223]/20 p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A3511]">
                      Shop the Collection
                    </p>
                    <h3 className="mt-2 text-xl md:text-2xl font-bold text-slate-900">
                      Discover Our Latest Fashion Arrivals
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Explore premium apparel and ethnic wear crafted for the modern wardrobe.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center rounded-full bg-[#7A3511] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#7A3511]/25 hover:bg-[#1C3A2E] transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>

              {blog.seoKeywords && blog.seoKeywords.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">Related topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {blog.seoKeywords.map((keyword) => (
                      <Link
                        key={keyword}
                        href={`/blog?keyword=${keyword}`}
                        className="bg-[#7A3511]/10 text-[#7A3511] text-sm px-4 py-2 rounded-full hover:bg-[#7A3511]/20 transition-colors"
                      >
                        {keyword}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>

          {relatedBlogs.length > 0 && (
            <section className="mt-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                You might also like
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedBlogs.map((relatedBlog, index) => (
                  <div
                    key={relatedBlog._id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <BlogCard
                      blog={relatedBlog}
                      variant="grid"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-16 bg-gradient-to-br from-[#936965] via-[#5A260F] to-[#7A3511] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4B223] rounded-full filter blur-3xl opacity-20 -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F4B223] rounded-full filter blur-3xl opacity-20 translate-y-32 -translate-x-32" />
            
            <div className="relative">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Stay updated with our latest insights
              </h3>
              <p className="text-xl text-white/75 mb-8 max-w-2xl mx-auto">
                Join our community for weekly fit guides, styling tips, and new arrivals straight to your inbox
              </p>
              
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#F4B223]/60"
                  />
              </div>
              <button
                type="submit"
                disabled={submittingSubscribe}
                className="bg-white text-[#7A3511] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-105 hover:shadow-xl whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submittingSubscribe ? "Submitting..." : "Subscribe"}
              </button>
              </form>
              
              <p className="text-sm text-white/70 mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <span>Back to top</span>
              <svg
                className="w-5 h-5 group-hover:-translate-y-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    </>
  );
}

