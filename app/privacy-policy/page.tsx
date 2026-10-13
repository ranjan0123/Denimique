import type { Metadata } from "next";
import Link from "next/link";
import PolicyActions from "@/components/legal/PolicyActions";
import type { ReactNode } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
const LAST_UPDATED = "October 7, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | Denimique",
  description:
    "Denimique’s Privacy Policy explains what personal data we collect, why we collect it, how we use and share it, how long we keep it, and your choices and rights.",
  keywords: [
    "Denimique privacy policy",
    "data protection",
    "personal information",
    "cookies",
    "ecommerce privacy",
    "India",
  ],
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Denimique",
    description:
      "Learn how Denimique collects, uses, shares, and protects personal information, and the choices you have.",
    url: "/privacy-policy",
    type: "article",
    locale: "en_IN",
    siteName: "Denimique",
    images: ["/logo-removebg-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Denimique",
    description:
      "Learn how Denimique collects, uses, shares, and protects personal information, and the choices you have.",
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

export default function PrivacyPolicyPage() {
  const privacyPolicyJsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: "Privacy Policy",
    url: `${SITE_URL}/privacy-policy`,
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
    <main className="bg-[#FDFBF7] text-gray-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(privacyPolicyJsonLd),
        }}
      />
      {/* Hero */}

      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-44 -right-40 h-96 w-96 rounded-full bg-[#102B50]/6 blur-3xl" />
          <div className="absolute -bottom-52 -left-56 h-[520px] w-[520px] rounded-full bg-[#102B50]/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#102B50]/30 bg-white/70 px-4 py-2 text-xs font-semibold text-[#102B50] backdrop-blur">
                Legal • Privacy
                <span className="h-1 w-1 rounded-full bg-[#102B50]" />
                Last updated {LAST_UPDATED}
              </p>
              <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-[#102B50]">
                Privacy Policy
              </h1>
              <p className="mt-2 max-w-2xl text-slate-700 text-sm md:text-base leading-normal">
                This Privacy Policy explains how Denimique collects, uses,
                shares, and protects your personal information when you visit
                our website, create an account, or place an order.
              </p>
            </div>

            <div className="md:pb-1">
              <PolicyActions />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "What we collect",
                body: "Contact details, account info, order details, and limited device data needed to run the site.",
              },
              {
                title: "Why we collect it",
                body: "To process orders, provide support, prevent fraud, improve the experience, and meet legal obligations.",
              },
              {
                title: "Your control",
                body: "Access, update, or delete data (where applicable), and choose cookie settings and marketing preferences.",
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

          <div className="mt-4 rounded-xl border border-[#102B50]/15 bg-[#F1F4F8] p-3 text-sm text-[#102B50]">
            <p className="font-semibold">Important note</p>
            <p className="mt-1 leading-normal">
              This page is provided for transparency and customer trust. It is
              not legal advice. If you need help tailoring your compliance
              obligations, please consult a qualified professional.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <article className="space-y-4">
            <Section id="scope" title="Scope & Who We Are">
              <p>
                This Privacy Policy applies to the Denimique website and related
                customer support and communications.
              </p>
              <p>
                <b>Business:</b> Denimique • H-63, Sector 62, Noida, Uttar
                Pradesh 201301 • India.
              </p>
              <p>
                By using our services, you acknowledge that you have read and
                understood this policy.
              </p>
            </Section>

            <Section id="data-we-collect" title="Information We Collect">
              <p>
                We collect information you provide directly, information created
                when you use our services, and limited information from cookies
                and similar technologies.
              </p>
              <h3 className="text-lg font-extrabold text-slate-900">
                Information you provide
              </h3>
              <BulletList
                items={[
                  "Account details (e.g., name, email, password in hashed form).",
                  "Contact details (e.g., phone number, delivery address).",
                  "Order details (e.g., products purchased, quantity, order history).",
                  "Support requests and messages you send us (e.g., via contact forms).",
                  "Business enquiry details for wholesale/bulk requests (e.g., business name, requirements).",
                ]}
              />
              <h3 className="text-lg font-extrabold text-slate-900">
                Information collected automatically
              </h3>
              <BulletList
                items={[
                  "Device and usage data (e.g., browser type, pages viewed, approximate location from IP, timestamps).",
                  "Log and diagnostic data (e.g., errors, performance metrics) to keep the site reliable.",
                  "Cookie identifiers and preference data (see Cookies & Tracking below).",
                ]}
              />
              <h3 className="text-lg font-extrabold text-slate-900">
                Payment information
              </h3>
              <p>
                If you pay for an order, payment processing is typically handled
                by a third-party payment provider. We generally do not store
                full card details on our servers. The payment provider may
                collect information such as card details, UPI ID, or bank
                authorization details as required to complete the transaction.
              </p>
            </Section>

            <Section id="how-we-use" title="How We Use Information">
              <p>We use personal information to:</p>
              <BulletList
                items={[
                  "Create and manage your account.",
                  "Process orders, deliveries, returns, and refunds.",
                  "Provide customer support and respond to enquiries.",
                  "Send service messages (e.g., order confirmations, delivery updates).",
                  "Improve our products, website experience, and reliability.",
                  "Detect, prevent, and investigate fraud, abuse, or security issues.",
                  "Comply with legal and tax requirements and resolve disputes.",
                  "With your consent where required, send marketing communications (you can opt out anytime).",
                ]}
              />
            </Section>

            <Section id="legal-bases" title="Legal Bases (GDPR/DPDP)">
              <p>
                Depending on where you live, we process your information under
                one or more legal bases, such as:
              </p>
              <BulletList
                items={[
                  "Contract necessity: to provide services you request (e.g., fulfilling orders).",
                  "Legitimate interests: to secure, maintain, and improve our services (balanced against your rights).",
                  "Consent: where required for marketing or certain cookies/trackers.",
                  "Legal obligation: to meet compliance, tax, and record-keeping requirements.",
                ]}
              />
              <p>
                For users in India, we also follow applicable requirements under
                the Digital Personal Data Protection Act, 2023 (DPDP Act), where
                relevant.
              </p>
            </Section>

            <Section id="cookies" title="Cookies & Tracking">
              <p>
                Cookies and similar technologies help us keep the site working,
                remember preferences, and understand how the site is used.
              </p>
              <h3 className="text-lg font-extrabold text-slate-900">
                Types of cookies we may use
              </h3>
              <BulletList
                items={[
                  "Strictly necessary: required for core site functionality (e.g., login, security).",
                  "Preferences: remember choices like region or settings.",
                  "Analytics: help us understand site traffic and improve performance.",
                  "Marketing: measure campaign effectiveness and show relevant offers (where enabled).",
                ]}
              />
              <p>
                You can control cookies through your browser settings. If you
                disable cookies, certain features may not work as intended.
              </p>
            </Section>

            <Section id="sharing" title="Sharing & Disclosure">
              <p>
                We do not sell your personal information. We may share
                information in the following situations:
              </p>
              <BulletList
                items={[
                  "Service providers: vendors who help us operate the site (hosting, analytics, customer support tools).",
                  "Payment providers: to process transactions and prevent fraud.",
                  "Shipping and logistics partners: to deliver your order.",
                  "Legal and compliance: to comply with law, enforce our policies, or protect rights and safety.",
                  "Business transfers: if we’re involved in a merger, acquisition, or asset sale (with appropriate safeguards).",
                ]}
              />
              <p>
                When we share data with service providers, we expect them to use
                it only for the purposes we specify and to protect it
                appropriately.
              </p>
            </Section>

            <Section id="retention" title="Data Retention">
              <p>
                We keep personal information only as long as needed for the
                purposes described in this policy, including to comply with
                legal, accounting, or reporting obligations.
              </p>
              <p>
                Retention periods may vary depending on the type of data and why
                we collected it (for example, transaction records may be kept
                longer than marketing preferences).
              </p>
            </Section>

            <Section id="security" title="Security">
              <p>
                We use reasonable administrative, technical, and physical
                safeguards designed to protect your information. However, no
                method of transmission over the internet or method of storage is
                100% secure. If you believe your account has been compromised,
                please contact us immediately.
              </p>
              <BulletList
                items={[
                  "Access controls and least-privilege practices where feasible.",
                  "Encryption in transit (HTTPS) for website traffic.",
                  "Monitoring for suspicious activity and abuse.",
                ]}
              />
            </Section>

            <Section id="your-rights" title="Your Rights & Choices">
              <p>
                Depending on your jurisdiction, you may have rights such as:
              </p>
              <BulletList
                items={[
                  "Access: request a copy of the personal information we hold about you.",
                  "Correction: update inaccurate or incomplete information.",
                  "Deletion: request deletion in certain cases.",
                  "Objection / Restriction: object to or restrict certain processing.",
                  "Portability: request transfer of your data where applicable.",
                  "Withdraw consent: where processing is based on consent (e.g., marketing).",
                ]}
              />
              <p>
                To make a request, contact us using the details in the{" "}
                <a href="#contact" className="text-[#102B50] hover:underline">
                  Contact Us
                </a>{" "}
                section. We may need to verify your identity before responding.
              </p>
              <p>
                Marketing emails, if any, will include an unsubscribe link. You
                can also contact us to update your preferences.
              </p>
            </Section>

            <Section id="children" title="Children’s Privacy">
              <p>
                Our services are not directed to children under 13 (or under the
                minimum age required in your jurisdiction). We do not knowingly
                collect personal information from children. If you believe a
                child has provided personal information, please contact us and
                we will take appropriate steps to delete it.
              </p>
            </Section>

            <Section id="international" title="International Transfers">
              <p>
                We are based in India and may process information in India or
                other countries where our service providers operate. These
                locations may have data protection laws different from those in
                your jurisdiction. Where required, we take steps to ensure
                appropriate safeguards are in place for cross-border transfers.
              </p>
            </Section>

            <Section id="changes" title="Changes To This Policy">
              <p>
                We may update this policy from time to time. If we make material
                changes, we will post the updated version on this page and
                revise the “Last updated” date at the top.
              </p>
            </Section>

            <Section id="contact" title="Contact Us">
              <p>
                If you have questions, concerns, or requests related to privacy,
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
                Prefer the quick route? Use our{" "}
                <Link
                  href="/contact"
                  className="text-[#102B50] hover:underline"
                >
                  Contact page
                </Link>{" "}
                and mention “Privacy” in your message.
              </p>
            </Section>
          </article>
        </div>
      </section>
    </main>
  );
}
