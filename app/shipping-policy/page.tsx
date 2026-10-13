import type { Metadata } from "next";
import Link from "next/link";
import PolicyActions from "@/components/legal/PolicyActions";
import type { ReactNode } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
const LAST_UPDATED = "October 7, 2026";

export const metadata: Metadata = {
  title: "Shipping Policy | Denimique",
  description:
    "Learn about Denimique’s shipping process, delivery estimates, courier tracking, and shipping charges.",
  keywords: [
    "Denimique shipping policy",
    "delivery time India",
    "order tracking",
    "courier partners",
  ],
  alternates: {
    canonical: "/shipping-policy",
  },
  openGraph: {
    title: "Shipping Policy | Denimique",
    description:
      "Understand how Denimique ships orders, delivery estimates, tracking, and logistics.",
    url: "/shipping-policy",
    type: "article",
    locale: "en_IN",
    siteName: "Denimique",
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

export default function ShippingPolicyPage() {
  const shippingJsonLd = {
    "@context": "https://schema.org",
    "@type": "ShippingDeliveryTime",
    name: "Shipping Policy",
    url: `${SITE_URL}/shipping-policy`,
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 2,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  };

  return (
    <main className="bg-linear-to-br from-[#FDFBF7] via-white to-white text-gray-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shippingJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#102B50]/30 bg-white/70 px-4 py-2 text-xs font-semibold text-[#102B50] backdrop-blur">
                Legal • Shipping
                <span className="h-1 w-1 rounded-full bg-[#102B50]" />
                Last updated {LAST_UPDATED}
              </p>
              <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-[#102B50]">
                Shipping Policy
              </h1>
              <p className="mt-2 max-w-2xl text-slate-700 text-sm md:text-base leading-normal">
                This Shipping Policy explains how Denimique processes and
                delivers orders across India through its logistics network.
              </p>
            </div>

            <div className="md:pb-1">
              <PolicyActions />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <article className="space-y-4">
            <Section id="overview" title="Overview">
              <p>
                Denimique aims to deliver orders safely and reliably across
                India, working with trusted courier partners to get your order
                to your doorstep.
              </p>
              <p>
                From order confirmation to doorstep delivery, every shipment is
                carefully handled, and you&apos;ll receive updates on your order
                status along the way.
              </p>
              <p>
                We aim to provide a seamless shipping experience with timely
                dispatch, secure packaging, and transparent communication at
                every step of your order journey.
              </p>
            </Section>

            <Section id="processing-time" title="Order Processing Time">
              <p>
                We aim to process and dispatch your orders as quickly as
                possible to ensure timely delivery. All orders are carefully
                verified, packed, and handed over to our logistics partners for
                shipment.
              </p>

              <BulletList
                items={[
                  "Orders are typically processed within 1–2 business days after confirmation.",
                  "Orders placed on weekends or public holidays are processed on the next working day.",
                  "Bulk or high-volume orders may require additional processing time.",
                  "You will receive a confirmation and tracking details once your order is dispatched.",
                ]}
              />

              <p>
                Our team ensures every order is securely packed and
                quality-checked before shipping, so it reaches you in perfect
                condition.
              </p>
            </Section>

            <Section id="shipping-time" title="Shipping & Delivery Time">
              <p>
                Once your order is dispatched, delivery timelines depend on your
                location and the courier partner assigned through our logistics
                network.
              </p>

              <BulletList
                items={[
                  "Metro cities: Delivery within 2–4 business days.",
                  "Tier 2 & other cities: Delivery within 3–7 business days.",
                  "Remote or rural areas: Delivery may take up to 7–10 business days.",
                ]}
              />

              <p>
                Please note that delivery timelines are estimates and may vary
                due to factors such as weather conditions, courier operations,
                or high demand periods.
              </p>

              <p>
                We provide real-time tracking for all orders so you can stay
                updated on your shipment status at every step.
              </p>
            </Section>

            <Section id="shipping-charges" title="Shipping Charges">
              <p>
                We strive to keep shipping charges transparent and affordable
                for all our customers. The final shipping cost (if any) is
                calculated at checkout based on your order value, location, and
                selected payment method.
              </p>

              <BulletList
                items={[
                  "Shipping charges and any applicable offers are calculated and shown at checkout based on the order and delivery details.",
                  "Cash on Delivery availability and any applicable fee are shown at checkout.",
                  "Shipping charges (if applicable) will be clearly displayed at checkout before payment.",
                ]}
              />

              <p>
                We regularly run promotions and offers to provide free or
                discounted shipping, helping you get the best value on your
                orders.
              </p>
            </Section>

            <Section id="courier-partners" title="Courier Partners">
              <p>
                To ensure fast and reliable deliveries across India, we work
                with trusted courier partners selected for speed, reliability,
                and coverage in your area.
              </p>

              <BulletList
                items={[
                  "Delhivery",
                  "Blue Dart",
                  "XpressBees",
                  "Ecom Express",
                  "Other trusted regional courier partners (as applicable)",
                ]}
              />

              <p>
                The courier used for your order depends on your location and
                what&apos;s available for the fastest, most reliable delivery.
              </p>
            </Section>

            <Section id="tracking" title="Order Status">
              <p>
                You can check the status of your order anytime from the{" "}
                <Link href="/orders" className="text-[#102B50] hover:underline">
                  My Orders
                </Link>{" "}
                page in your account — from order placed through to delivered.
              </p>

              <p>
                We&apos;ll also notify you by email as your order moves through
                processing, shipping, and delivery.
              </p>
            </Section>

            <Section id="delays" title="Delays & Exceptions">
              <p>
                While we strive to deliver all orders within the estimated
                timelines, certain external factors may occasionally cause
                delays.
              </p>

              <BulletList
                items={[
                  "Weather conditions, natural disruptions, or unforeseen events.",
                  "Courier operational delays or high shipment volumes during peak periods.",
                  "Incorrect or incomplete delivery address details.",
                ]}
              />

              <p>
                Please note that such delays are beyond our direct control.
                However, our team will actively assist you and coordinate with
                courier partners to resolve any delivery issues as quickly as
                possible.
              </p>
            </Section>

            <Section id="address" title="Incorrect Address">
              <p>
                Please ensure that your delivery address and contact details are
                accurate and complete at the time of placing your order to avoid
                any delays or issues.
              </p>

              <BulletList
                items={[
                  "Incorrect or incomplete address details may result in delivery delays or failed attempts.",
                  "If an order is returned due to incorrect information, additional re-shipping charges may apply.",
                  "Our team may contact you to verify details if required, which could impact delivery timelines.",
                ]}
              />

              <p>
                We recommend double-checking your address and phone number
                during checkout to ensure a smooth and hassle-free delivery
                experience.
              </p>
            </Section>

            <Section id="international" title="International Shipping">
              <p>
                At present, Denimique delivers orders within India.
                International delivery is not currently offered unless a
                checkout option explicitly states otherwise.
              </p>

              <p>
                Stay tuned for updates as we continue to grow and bring our
                products to customers worldwide.
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
