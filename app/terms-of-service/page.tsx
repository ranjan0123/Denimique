import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import PolicyActions from "@/components/legal/PolicyActions";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
const LAST_UPDATED = "October 7, 2026";

export const metadata: Metadata = {
  title: "Terms of Service | Denimique",
  description:
    "Denimique’s Terms of Service explain the rules for using our website and services, placing orders, payments, shipping, returns, and your responsibilities.",
  keywords: [
    "Denimique terms",
    "terms of service",
    "terms of service",
    "ecommerce terms",
    "India",
  ],
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service | Denimique",
    description:
      "Read Denimique’s Terms of Service for website access, orders, payments, shipping, returns, and legal conditions.",
    url: "/terms-of-service",
    type: "article",
    locale: "en_IN",
    siteName: "Denimique",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Denimique",
    description:
      "Read Denimique’s Terms of Service for website access, orders, payments, shipping, returns, and legal conditions.",
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
      <h2 className="text-lg md:text-xl font-extrabold text-black tracking-tight">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-normal text-black">
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

export default function TermsPage() {
  const termsJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Service",
    url: `${SITE_URL}/terms-of-service`,
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
    <main className="bg-white text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-44 -right-40 h-96 w-96 rounded-full bg-[#102B50]/8 blur-3xl" />
          <div className="absolute -bottom-52 -left-56 h-[520px] w-[520px] rounded-full bg-[#102B50]/6 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#102B50]/30 bg-white/70 px-4 py-2 text-xs font-semibold text-black backdrop-blur">
                Legal • Terms
                <span className="h-1 w-1 rounded-full bg-[#102B50]" />
                Last updated {LAST_UPDATED}
              </p>
              <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-black">
                Terms of Service
              </h1>
              <p className="mt-2 max-w-2xl text-black text-sm md:text-base leading-normal">
                These Terms of Service govern your access to and use of
                Denimique, website and services, including purchasing products
                and interacting with our customer support.
              </p>
            </div>

            <div className="md:pb-1">
              <PolicyActions />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "Simple rule",
                body: "Use Denimique responsibly, lawfully, and respectfully.",
              },
              {
                title: "Orders",
                body: "Product availability, pricing, and delivery timelines may change; we’ll confirm at checkout/order time.",
              },
              {
                title: "Support",
                body: "Questions? Our team is happy to help through the Contact page.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm backdrop-blur"
              >
                <p className="text-sm font-bold text-black">{card.title}</p>
                <p className="mt-1 text-sm leading-normal text-black">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <article className="space-y-4">
            <Section id="overview" title="Overview">
              <p>
                These Terms apply to your use of Denimique’s website, account
                features, and purchases. By accessing or using our services, you
                agree to these Terms and our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-black hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                <b>Business:</b> Denimique • H-63, Sector 62, Noida, Uttar
                Pradesh 201301 • India.
              </p>
            </Section>

            <Section id="eligibility" title="Eligibility">
              <p>
                You may use our services only if you can form a legally binding
                contract under applicable law. If you use Denimique on behalf of
                a business, you confirm you have authority to accept these Terms
                for that business.
              </p>
            </Section>

            <Section id="accounts" title="Accounts & Security">
              <p>
                Creating an account may be required for certain features. You
                are responsible for maintaining the confidentiality of your
                login credentials and for all activity under your account.
              </p>
              <BulletList
                items={[
                  "Provide accurate, up-to-date information and keep it current.",
                  "Do not share your password or access tokens with others.",
                  "Notify us promptly if you suspect unauthorized access.",
                ]}
              />
            </Section>

            <Section id="orders" title="Orders, Pricing & Payments">
              <p>
                When you place an order, you agree to pay the total amount shown
                at checkout, including applicable taxes, shipping charges, and
                any fees displayed.
              </p>
              <h3 className="text-lg font-extrabold text-black">
                Availability & pricing
              </h3>
              <BulletList
                items={[
                  "Product availability may change without notice.",
                  "Prices and offers may change; the price at checkout applies to your order.",
                  "We may cancel or refuse orders in cases of suspected fraud, pricing errors, or supply constraints.",
                ]}
              />
              <h3 className="text-lg font-extrabold text-black">
                Payments
              </h3>
              <p>
                Payments are processed through third-party payment providers. We
                do not typically store full card details on our servers.
              </p>
            </Section>

            <Section id="shipping" title="Shipping & Delivery">
              <p>
                Delivery timelines are estimates and may vary based on your
                location, courier operations, and other external factors.
              </p>
              <BulletList
                items={[
                  "Ensure your shipping details are accurate before placing an order.",
                  "Risk of loss may pass to you upon delivery (subject to applicable law).",
                  "If a package appears damaged, please document it and contact support promptly.",
                ]}
              />
            </Section>

            <Section id="returns" title="Returns & Refunds">
              <p>
                Returns and refunds, where available, depend on the product
                type, condition, and the Refund &amp; Cancellation Policy. Items
                must meet the eligibility requirements stated in that policy.
              </p>
              <p>
                For return/refund requests, contact us with your order details
                through the{" "}
                <Link
                  href="/contact"
                  className="text-black hover:underline"
                >
                  Contact page
                </Link>
                .
              </p>
            </Section>

            <Section id="promotions" title="Offers & Promotions">
              <p>
                Promotions may be subject to additional rules, validity periods,
                exclusions, and limitations. We reserve the right to modify or
                withdraw promotions where permitted by law.
              </p>
            </Section>

            <Section id="acceptable-use" title="Acceptable Use">
              <p>You agree not to:</p>
              <BulletList
                items={[
                  "Use the website in a way that violates any applicable law or regulation.",
                  "Attempt to gain unauthorized access to accounts, systems, or networks.",
                  "Interfere with security features or disrupt the service (e.g., scraping, DDoS, malware).",
                  "Use our brand/assets in a misleading way or impersonate Denimique or its operator.",
                ]}
              />
            </Section>

            <Section id="ip" title="Intellectual Property">
              <p>
                The website, brand, logos, designs, content, and product
                presentation are owned by or licensed to Denimique or its
                operator and are protected by applicable intellectual property
                laws.
              </p>
            </Section>

            <Section id="third-party" title="Third-Party Services">
              <p>
                We may link to third-party websites or use third-party services
                (such as payment processors and logistics partners). We are not
                responsible for third-party content, policies, or practices.
              </p>
            </Section>

            <Section id="disclaimers" title="Disclaimers">
              <p>
                We provide the website and services on an “as is” and “as
                available” basis, to the extent permitted by law. We do not
                guarantee uninterrupted access or that the site will be error
                free at all times.
              </p>
            </Section>

            <Section id="liability" title="Limitation of Liability">
              <p>
                To the maximum extent permitted by law, Denimique, its operator,
                and affiliates will not be liable for indirect, incidental,
                special, or consequential damages, or loss of profits, arising
                out of or related to your use of the services.
              </p>
            </Section>

            <Section id="indemnity" title="Indemnity">
              <p>
                You agree to indemnify and hold harmless Denimique and its
                operator from claims arising out of your misuse of the services
                or violation of these Terms.
              </p>
            </Section>

            <Section id="law" title="Governing Law">
              <p>
                These Terms are governed by the laws of India. Courts with
                appropriate jurisdiction in Uttar Pradesh, India, will have
                jurisdiction over disputes, subject to applicable law.
              </p>
            </Section>

            <Section id="changes" title="Changes">
              <p>
                We may update these Terms from time to time. If we make material
                changes, we will post the updated version on this page and
                revise the “Last updated” date.
              </p>
            </Section>

            <Section id="contact" title="Contact">
              <p>For questions about these Terms, contact:</p>
              <div className="rounded-xl border border-slate-100 bg-[#FFF8EE]/60 p-3">
                <p className="font-bold text-black">Denimique</p>
                <p className="mt-1 text-black">
                  Email:{" "}
                  <a
                    className="font-semibold text-black hover:underline"
                    href="mailto:care@denimique.com"
                  >
                    Care@denimique.com
                  </a>
                  <br />
                  Phone:{" "}
                  <a
                    className="font-semibold text-black hover:underline"
                    href="tel:+919625610749"
                  >
                    +91 96256 10749
                  </a>
                  <br />
                  Address: H-63, Sector 62, Noida, Uttar Pradesh 201301, India
                </p>
              </div>
            </Section>
          </article>
        </div>
      </section>
    </main>
  );
}
