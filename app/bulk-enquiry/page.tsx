import Link from "next/link";
import Image from "@/components/ui/AppImage";
import WholesaleEnquiryForm from "@/components/forms/WholesaleEnquiryForm";
import type { Metadata } from "next";
import { 
  ArrowRight, 
  BadgeCheck, 
  Factory, 
  Handshake, 
  PackageCheck, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Users, 
  Wheat,
  ChevronRight,
  Clock,
  Star,
  MapPin,
  Mail,
  ChevronDown
} from "lucide-react";

export const metadata: Metadata = {
  title: "Fashion Wholesale Supplier in India | Denimique",
  description:
    "India's trusted fashion wholesale supplier. Curated MOQ packs, quality assured, 500+ pin codes, 30%+ distributor margins. Get bulk pricing in 24 hours. Call +91 9625610749.",
  keywords: [
    "fashion wholesale",
    "apparel supplier",
    "bulk fashion India",
    "ethnic wear distributor",
    "private label fashion",
  ],
  alternates: {
    canonical: "/bulk-enquiry",
  },
  openGraph: {
    title: "Fashion Wholesale Supplier in India | Denimique",
    description: "Bulk fashion apparel supply with consistent quality & pan-India delivery",
    url: "/bulk-enquiry",
    type: "website",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion Wholesale Supplier in India | Denimique",
    description:
      "Bulk fashion apparel supply, distributor support, and pan-India logistics from Denimique.",
    images: ["/logo-removebg-preview.png"],
  },
};

const valueProps = [
  {
    title: "Pan-India Bulk Supply",
    description: "Reliable dispatch to 500+ pin codes with real-time tracking.",
    icon: Truck,
    stats: "500+ Pin Codes",
  },
  {
    title: "Competitive B2B Pricing",
    description: "Margin-optimized pricing with volume-based discounts.",
    icon: Sparkles,
    stats: "Best Margins",
  },
  {
    title: "Consistent Quality",
    description: "Certified facilities with standardized quality checks.",
    icon: PackageCheck,
    stats: "Quality Certified",
  },
  {
    title: "Express Logistics",
    description: "Dedicated fleet for time-sensitive B2B orders.",
    icon: ShieldCheck,
    stats: "7-10 Day Delivery",
  },
];

const wholesaleDetails = [
  {
    title: "Flexible Bulk Orders",
    description: "20kg to multi-ton consignments with transparent pricing slabs.",
    icon: Wheat,
    highlight: "MOQ 20kg",
  },
  {
    title: "Custom Packaging",
    description: "Retail-ready packs, stand-up pouches, and eco-friendly options.",
    icon: PackageCheck,
    highlight: "Your Branding",
  },
  {
    title: "Retail-Ready Packaging",
    description: "Stand-up pouches, jars, and bulk packs tailored to your channel.",
    icon: Factory,
    highlight: "Ready to Sell",
  },
  {
    title: "Scalable Commitment",
    description: "Flexible MOQ structure for growing distributors.",
    icon: BadgeCheck,
    highlight: "Grow With Us",
  },
];

const distributorBenefits = [
  {
    title: "Territory Exclusivity",
    description: "First-mover advantage in your region with protected territories.",
    icon: MapPin,
  },
  {
    title: "Industry-best Margins",
    description: "30%+ margins with marketing collateral and sales support.",
    icon: Star,
  },
  {
    title: "Dedicated Account Manager",
    description: "Personalized support for onboarding, training, and growth.",
    icon: Users,
  },
];

const tonePalette = [
  "from-amber-400/30 to-amber-600/10",
  "from-red-400/30 to-red-600/10",
  "from-emerald-400/30 to-emerald-600/10",
  "from-blue-400/30 to-blue-600/10",
];

const gradientPalette = [
  "bg-gradient-to-br from-amber-50 to-amber-100/50",
  "bg-gradient-to-br from-red-50 to-orange-100/50",
  "bg-gradient-to-br from-emerald-50 to-teal-100/50",
  "bg-gradient-to-br from-blue-50 to-indigo-100/50",
];

type WholesaleProduct = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  isBestSeller?: boolean;
};

import { API_BASE_URL } from "@/lib/apiConfig";

const fetchWholesaleProducts = async (): Promise<WholesaleProduct[]> => {
  const response = await fetch(`${API_BASE_URL}/products?limit=4`, {
    cache: "no-store",
  });
  if (!response.ok) return [];
  const data = await response.json();
  const items = (data.products || data || []) as Array<{
    _id?: string;
    id?: string;
    slug?: string;
    name?: string;
    images?: string[];
    isBestSeller?: boolean;
  }>;

  const fashionPreview = [
    {
      name: "Luxury Kurta Set",
      description: "Elegant festive and daily-wear kurtas designed for modern Indian style.",
    },
    {
      name: "Fusion Evening Dress",
      description: "Contemporary silhouettes with premium detailing for special occasions.",
    },
    {
      name: "Premium Linen Suit",
      description: "Breathable, tailored essentials made for comfort, polish, and all-day wear.",
    },
    {
      name: "Floral Festive Co-ord",
      description: "Statement co-ords and occasion-ready outfits crafted for celebrations.",
    },
  ];

  return items.slice(0, 4).map((item, index) => {
    const preview = fashionPreview[index % fashionPreview.length];

    return {
      id: item._id || item.id || item.slug || item.name || "",
      name: preview.name,
      description: preview.description,
      slug: item.slug || item._id || item.id || "",
      image: (item.images || [])[0] || "",
      isBestSeller: Boolean(item.isBestSeller),
    };
  });
};

const faqs = [
  {
    question: "What types of fashion products do you offer?",
    answer: "We offer premium ethnic wear, fusion outfits, kurtas, festive collections, and occasion-ready apparel for men and women."
  },
  {
    question: "Do you provide sizing guidance for outfits?",
    answer: "Yes, each product listing includes fit and size details, and our team can help with styling and size selection before checkout."
  },
  {
    question: "Can I shop for special occasions like weddings and festivals?",
    answer: "Absolutely. Our curated collections include wedding wear, festive kurtas, designer-inspired looks, and premium party outfits."
  }
];

export default async function FashionWholesalePage() {
  const products = await fetchWholesaleProducts();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <div id="top" className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-slate-900">
        Skip to main content
      </a>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white" aria-labelledby="hero-heading">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(11,15,107,0.06)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(245,180,0,0.08)_0%,_transparent_50%)]" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#7A3511]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F4B223]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full border border-slate-200 px-4 py-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7A3511] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7A3511]"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-slate-600">
                  PREMIUM FASHION WHOLESALE PARTNER
                </span>
              </div>

              <h1 id="hero-heading" className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
                Premium Fashion{' '}
                <span className="bg-gradient-to-r from-[#7A3511] to-[#5A260F] bg-clip-text text-transparent">
                  Wholesale
                </span>{' '}
                Supplier
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Power your business with Denimique&apos;s curated fashion, denim, and trend-led apparel designed for modern retail and B2B growth.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="#enquiry"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#7A3511] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-[#7A3511]/30 hover:shadow-xl hover:bg-[#5A260F] transition-all duration-300 transform hover:-translate-y-0.5"
                  aria-label="Request fashion pricing"
                >
                  Request Fashion Pricing
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#distributor"
                  className="group inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white/90 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-slate-700 hover:border-[#7A3511] hover:text-[#7A3511] hover:bg-white transition-all duration-300"
                >
                  Become a Retail Partner
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap items-center gap-3" aria-label="Certifications">
                {[
                  { icon: BadgeCheck, text: "Quality Certified", color: "text-[#7A3511]" },
                  { icon: ShieldCheck, text: "Quality Assured", color: "text-[#7A3511]" },
                  { icon: Sparkles, text: "Premium Grade", color: "text-[#7A3511]" }
                ].map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm"
                    >
                      <Icon className={`h-4 w-4 ${badge.color}`} />
                      {badge.text}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Right column - Stats card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#7A3511]/20 to-[#F4B223]/20 rounded-[32px] blur-2xl" />
              <div className="relative bg-white/90 backdrop-blur-sm rounded-[28px] border border-slate-200 p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold text-[#7A3511] tracking-wide">
                      FASHION HIGHLIGHTS
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">
                      Built for Fashion Growth
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-[#F4B223] to-[#F4B223]/80 p-3 text-white shadow-lg">
                    <Handshake className="h-6 w-6" />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#7A3511]">150+</div>
                    <div className="text-xs text-slate-600">Distributors (as of 2026)</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#7A3511]">500+</div>
                    <div className="text-xs text-slate-600">Pin Codes</div>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-600">
                  {[
    "Seasonal and festive collections for modern wardrobes",
    "Curated silhouettes with premium craftsmanship",
    "Quick dispatch and stock support for retail partners",
    "Retail-ready packaging and style consistency"
  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#7A3511] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 bg-gradient-to-r from-[#7A3511]/5 to-[#F4B223]/5 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-[#7A3511]">Fashion MOQ:</span>{' '}
                    Starting from curated assortment packs and seasonal drops
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS */}
      <section className="py-20 bg-gradient-to-b from-[#FFF8EE] to-white" aria-labelledby="value-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-[#7A3511] tracking-wider">WHY PARTNER WITH US</span>
            <h2 id="value-heading" className="mt-3 text-3xl font-bold text-slate-900">
              Built for Wholesale Success
            </h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to scale your fashion business efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7A3511]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="inline-flex rounded-2xl bg-gradient-to-br from-[#7A3511]/10 to-[#F4B223]/10 p-3 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-[#7A3511]" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                      {item.stats && (
                        <span className="inline-block mt-3 text-xs font-semibold text-[#7A3511] bg-[#7A3511]/5 px-2 py-1 rounded-full">
                          {item.stats}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHOLESALE DETAILS */}
      <section className="py-20 bg-white" aria-labelledby="wholesale-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-[#7A3511] tracking-wider">FASHION OPTIONS</span>
            <h2 id="wholesale-heading" className="mt-3 text-3xl font-bold text-slate-900">
              Fashion Wholesale Details
            </h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              Scale confidently with tailored apparel solutions for your business
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Order Specifications
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Minimum Order", value: "20kg (standard variants)" },
                  { label: "Lead Time", value: "7-10 business days" },
                  { label: "Payment Terms", value: "Flexible (advance/LC/credit)" },
                  { label: "Sample Policy", value: "Commercial samples available" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wholesaleDetails.map((detail) => {
                const Icon = detail.icon;
                return (
                  <div
                    key={detail.title}
                    className="bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-gradient-to-br from-[#F4B223]/20 to-[#F4B223]/5 rounded-xl p-2">
                        <Icon className="h-5 w-5 text-[#7A3511]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{detail.title}</h3>
                        <p className="mt-1 text-xs text-slate-600">{detail.description}</p>
                        {detail.highlight && (
                          <span className="inline-block mt-2 text-xs font-medium text-[#7A3511] bg-[#7A3511]/5 px-2 py-0.5 rounded">
                            {detail.highlight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* DISTRIBUTOR PROGRAM */}
      <section id="distributor" className="py-20 bg-gradient-to-b from-[#FFF8EE] to-white" aria-labelledby="distributor-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#7A3511] to-[#5A260F] rounded-[32px] p-10 md:p-12 text-white shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">Partner Program</span>
                </div>
                <h2 id="distributor-heading" className="mt-6 text-3xl md:text-4xl font-bold">
                  Become a Denimique Partner
                </h2>
                <p className="mt-4 text-lg text-white/90 leading-relaxed">
                  Join India&apos;s fastest-growing ethnic fashion distribution network. Get exclusive territories, strong margins, and dedicated support for your retail business.
                </p>
                
                <div className="mt-8 space-y-4">
                  {distributorBenefits.map((benefit, idx) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-white/20 rounded-lg p-2">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{benefit.title}</h3>
                          <p className="text-sm text-white/80">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="#enquiry"
                  className="inline-flex items-center gap-2 mt-8 bg-white text-[#7A3511] px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Apply for Partnership
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl" />
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <h3 className="text-2xl font-bold mb-4">Why Distributors Love Us</h3>
                  <div className="space-y-4">
                    {[
                      "Protected territories with no channel conflict",
                      "30%+ margins with volume incentives",
                      "Marketing collateral and POS material",
                      "Training and sales enablement support",
                      "Real-time order tracking and inventory management"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-[#F4B223] flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS PREVIEW */}
      <section className="py-20 bg-white" aria-labelledby="products-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-sm font-semibold text-[#7A3511] tracking-wider">OUR RANGE</span>
              <h2 id="products-heading" className="mt-3 text-3xl font-bold text-slate-900">
                Popular Fashion Collections
              </h2>
              <p className="mt-3 text-lg text-slate-600 max-w-2xl">
                Bestsellers crafted for wholesale and retail fashion success
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id || product.name}
                className="group bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-32 ${gradientPalette[index % gradientPalette.length]} relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${tonePalette[index % tonePalette.length]} opacity-50 group-hover:opacity-70 transition-opacity`} />
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover mix-blend-multiply opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                  ) : null}
                  <span className="absolute top-2 right-2 z-10 text-[11px] uppercase tracking-wide bg-white/95 text-[#7A3511] px-2.5 py-1 rounded-full shadow-md border border-white/70">
                    {product.isBestSeller ? "Bestseller" : "Wholesale Ready"}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {product.description || "Available in bulk packs with consistent quality"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#7A3511] bg-[#7A3511]/5 px-2 py-1 rounded">
                      Bulk Available
                    </span>
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm font-medium text-[#7A3511] hover:text-[#5A260F] transition-colors inline-flex items-center gap-1"
                      aria-label={`View ${product.name}`}
                    >
                      View
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-gradient-to-b from-[#FFF8EE] to-white" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-[#7A3511] tracking-wider">FAQ</span>
            <h2 id="faq-heading" className="mt-3 text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <summary className="flex justify-between items-center font-semibold text-slate-900 list-none">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 text-[#7A3511] group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-slate-600 text-sm pl-4 border-l-2 border-[#7A3511]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ENQUIRY FORM */}
      <section id="enquiry" className="py-20 bg-white" aria-labelledby="enquiry-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 id="enquiry-heading" className="text-3xl md:text-4xl font-bold text-slate-900">
                Get Wholesale Pricing & Details
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Share your business requirements and our B2B team will respond within 24 hours with 
                pricing, MOQ, and dispatch timelines.
              </p>
              
              <div className="mt-8 space-y-4">
                {[
                  { icon: Phone, text: "+91 78707 81900", sub: "Mon-Sat, 9am-7pm" },
                  { icon: Mail, text: "Email our team", sub: "24/7 support" },
                  { icon: Clock, text: "7-10 day lead time", sub: "Express shipping available" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-gradient-to-br from-[#7A3511]/10 to-[#F4B223]/10 rounded-xl p-3">
                        <Icon className="h-5 w-5 text-[#7A3511]" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.text}</p>
                        <p className="text-sm text-slate-600">{item.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <WholesaleEnquiryForm />
          </div>
        </div>
      </section>

      {/* Floating WhatsApp CTA */}
      {/* <Link
        href="https://wa.me/919625610749?text=Hi%2C%20I'm%20interested%20in%20your%20wholesale%20fashion%20pricing"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group inline-flex items-center gap-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-4 rounded-full text-white font-semibold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
        aria-label="Chat on WhatsApp"
      >
        <Phone className="h-5 w-5 group-hover:animate-pulse" />
        <span className="hidden sm:inline">Bulk Order WhatsApp Enquiry</span>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          1
        </span>
      </Link> */}

      {/* Back to top button */}
      <Link
        href="#top"
        className="fixed bottom-6 left-6 z-50 bg-white border border-slate-200 p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7A3511]/50"
        aria-label="Back to top"
      >
        <ChevronRight className="h-5 w-5 rotate-[-90deg] text-[#7A3511]" />
      </Link>
    </div>
  );
}




