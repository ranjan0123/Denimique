import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import PolicyActions from "@/components/legal/PolicyActions";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
const LAST_UPDATED = "October 7, 2026";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Denimique",
  description:
    "Learn how cancellations, returns, and refunds work for Denimique orders. Find eligibility rules, timelines, and how to request support.",
  keywords: [
    "Denimique refund policy",
    "Denimique cancellation policy",
    "returns and refunds",
    "ecommerce policy",
    "India",
  ],
  alternates: {
    canonical: "/refund-and-cancellation-policy",
  },
  openGraph: {
    title: "Refund & Cancellation Policy | Denimique",
    description:
      "Read Denimique's cancellation, return, and refund policy, including eligibility and timelines.",
    url: "/refund-and-cancellation-policy",
    type: "article",
    locale: "en_IN",
    siteName: "Denimique",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund & Cancellation Policy | Denimique",
    description:
      "Read Denimique's cancellation, return, and refund policy, including eligibility and timelines.",
    images: ["/logo-removebg-preview.png"],
  },
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true,
  },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[120px] rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"
    >
      <h2 className="text-lg md:text-xl font-extrabold text-[#102B50] tracking-tight">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-normal text-slate-700">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function RefundAndCancellationPolicyPage() {
  const policyJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Refund and Cancellation Policy",
    url: `${SITE_URL}/refund-and-cancellation-policy`,
    inLanguage: "en-IN",
    dateModified: LAST_UPDATED,
    isPartOf: {
      "@type": "WebSite",
      name: "Denimique",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Denimique",
      url: SITE_URL,
    },
  };

  return (
    <main className="bg-linear-to-br from-[#FDFBF7] via-white to-white text-gray-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(policyJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-44 -right-40 h-96 w-96 rounded-full bg-[#102B50]/8 blur-3xl" />
          <div className="absolute -bottom-52 -left-56 h-[520px] w-[520px] rounded-full bg-[#102B50]/6 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#102B50]/30 bg-white/70 px-4 py-2 text-xs font-semibold text-[#102B50] backdrop-blur">
                Legal • Refunds & Cancellations
                <span className="h-1 w-1 rounded-full bg-[#102B50]" />
                Last updated {LAST_UPDATED}
              </p>
              <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-[#102B50]">
                Refund & Cancellation Policy
              </h1>
              <p className="mt-2 max-w-2xl text-slate-700 text-sm md:text-base leading-normal">
                This policy explains when you can cancel a fashion order, when a
                return is accepted, and how refunds are processed for purchases
                made through the Denimique website.
              </p>
            </div>

            <div className="md:pb-1">
              <PolicyActions />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "Cancel fast",
                body: "Cancellations are easiest before dispatch. Contact us as soon as possible after placing your order.",
              },
              {
                title: "Quality assurance",
                body: "For apparel and festive wear, returns typically require the item to be unworn, unwashed, and in original condition.",
              },
              {
                title: "Quick help",
                body: "If a fashion item arrives damaged or incorrect, we review the issue and arrange an eligible resolution.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm backdrop-blur"
              >
                <p className="text-sm font-bold text-[#102B50]">{card.title}</p>
                <p className="mt-1 text-sm leading-normal text-slate-600">
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-sm text-amber-900/90">
            <p className="font-semibold">Important note</p>
            <p className="mt-1 leading-normal">
              This page is provided for customer clarity and trust. If any part
              of this policy conflicts with applicable law, the applicable law
              will prevail.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}

      <section className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <article className="space-y-4">
            <Section id="overview" title="Overview">
              <p>
                This policy applies to fashion and lifestyle purchases made
                through Denimique. For general usage terms, please review our{" "}
                <Link
                  href="/terms-of-service"
                  className="text-[#102B50] hover:underline"
                >
                  Terms of Service
                </Link>
                .
              </p>
              <BulletList
                items={[
                  "Cancellation requests are handled based on dispatch status.",
                  "Returns are accepted only in eligible cases and may require the item to be unopened and unused.",
                  "Refunds are processed to the original payment method where possible.",
                ]}
              />
            </Section>

            <Section id="cancellations" title="Order Cancellations">
              <p>
                You can request cancellation by contacting us immediately after
                placing an order. Cancellations are subject to whether the order
                has been dispatched.
              </p>
              <BulletList
                items={[
                  "Before dispatch: we generally cancel and refund the order (subject to verification).",
                  "After dispatch: cancellation may not be possible; you may still be eligible for a return if the item meets the Returns Eligibility conditions below.",
                  "If delivery is attempted and refused, return shipping or handling charges may be deducted where applicable.",
                ]}
              />
            </Section>

            <Section id="returns" title="Returns Eligibility">
              <p>
                Because we sell fashion and apparel products, product quality,
                fit, and condition matter. Returns may be accepted only when the
                item is eligible and verified.
              </p>
              <p className="font-extrabold text-slate-900">
                A return may be accepted if:
              </p>
              <BulletList
                items={[
                  "The item is unworn, unwashed, and in original packaging (where applicable).",
                  "The return request is raised within a reasonable time after delivery (typically within 7 days, unless otherwise required by law).",
                  "The product is not damaged due to customer handling, improper storage, or misuse.",
                ]}
              />
              <p className="text-sm text-slate-600">
                To request a return, email us your order ID, the reason, and
                photos where relevant. We will share next steps after review.
              </p>
            </Section>

            <Section id="refunds" title="Refunds (When & How)">
              <p>Refunds may be issued in cases such as:</p>
              <BulletList
                items={[
                  "Successful cancellation before dispatch.",
                  "Approved return after inspection/verification.",
                  "Confirmed damaged, missing, or wrong item (after verification).",
                ]}
              />
              <p>
                Refunds are typically processed to the original payment method
                used at checkout. For Cash on Delivery or other cases where the
                original method is not refundable, we may request bank/UPI
                details to process the refund.
              </p>
              <p className="text-sm text-slate-600">
                Promotional discounts (if any) are applied proportionally. If a
                refund is approved, the refunded amount may exclude shipping,
                COD, or convenience fees unless the issue was caused by us.
              </p>
            </Section>

            <Section id="non-returnable" title="Non-Returnable Items">
              <p>Unless required by law, we may not accept returns for:</p>
              <BulletList
                items={[
                  "Worn, washed, altered, or customized items.",
                  "Items damaged due to incorrect storage after delivery.",
                  "Items returned without prior approval or without required verification.",
                ]}
              />
            </Section>

            <Section id="damaged" title="Damaged / Wrong Items">
              <p>
                If your order arrives damaged, missing, or incorrect, please
                contact us as soon as possible with clear photos/videos of the
                package and product. We may offer:
              </p>
              <BulletList
                items={[
                  "Replacement (preferred where feasible).",
                  "Refund (full or partial) after verification.",
                  "Store credit (only if you choose it).",
                ]}
              />
              <p className="text-sm text-slate-600">
                Please keep the outer packaging and invoice (if any) until the
                issue is resolved.
              </p>
            </Section>

            <Section id="timelines" title="Processing Timelines">
              <BulletList
                items={[
                  "Acknowledgement: we typically respond within 1–2 business days.",
                  "Verification/inspection: timelines vary based on the case and courier pickup/return.",
                  "Refund initiation: typically within 3–7 business days after approval.",
                  "Bank/UPI settlement: may take additional time depending on your bank/payment provider.",
                ]}
              />
            </Section>

            <Section id="changes" title="Changes to This Policy">
              <p>
                We may update this policy from time to time as our collections,
                sizes, or product offerings evolve. If we make material changes,
                we will post the updated version on this page and revise the
                &quot;Last updated&quot; date at the top.
              </p>
            </Section>

            <Section id="contact" title="Contact">
              <p>
                For cancellations, return requests, or refund questions,
                contact:
              </p>
              <div className="rounded-xl border border-slate-100 bg-[#FFF8EE]/60 p-3">
                <p className="font-bold text-slate-900">Denimique</p>
                <p className="mt-1 text-slate-700">
                  Email:{" "}
                  <a
                    className="font-semibold text-[#102B50] hover:underline"
                    href="mailto:care@denimique.com"
                  >
                    Care@denimique.com
                  </a>
                  <br />
                  Phone:{" "}
                  <a
                    className="font-semibold text-[#102B50] hover:underline"
                    href="tel:+919625610749"
                  >
                    +91 96256 10749
                  </a>
                  <br />
                  Address: H-63, Sector 62, Noida, Uttar Pradesh 201301, India
                </p>
              </div>
              <p className="text-sm text-slate-600">
                You can also use our{" "}
                <Link
                  href="/contact"
                  className="text-[#102B50] hover:underline"
                >
                  Contact page
                </Link>{" "}
                and mention &quot;Refund/Cancellation&quot; in your message.
              </p>
            </Section>
          </article>
        </div>
      </section>
    </main>
  );
}
