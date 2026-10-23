import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Script from "next/script";
import AuthInitializer from "@/components/AuthInitializer";
import DeferredEnhancements from "@/components/DeferredEnhancements";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://suitablevastra.com";
const OG_IMAGE = "/logo-removebg-preview.png";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Denimique | Denim & Lifestyle Fashion",
    template: "%s",
  },
  icons: {
    icon: "/favicon-32x32.png",
  },
  description:
    "Discover modern denim and lifestyle fashion from Denimique, made for everyday style.",
  applicationName: "Denimique",
  keywords: [
    "fashion",
    "denim fashion",
    "lifestyle fashion",
    "apparel",
    "premium fashion India",
    "denimique",
  ],
  openGraph: {
    title: "Denimique | Denim & Lifestyle Fashion",
    description: "Modern denim and lifestyle fashion made for your everyday.",
    url: "/",
    siteName: "Denimique",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Denimique denim and lifestyle fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Denimique | Denim & Lifestyle Fashion",
    description: "Modern denim and lifestyle fashion made for your everyday.",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Denimique",
  legalName: "Denimique",
  description:
    "Denimique brings together modern denim and lifestyle fashion for everyday style.",
  brand: {
    "@type": "Brand",
    name: "Denimique",
  },
  url: SITE_URL,
  logo: `${SITE_URL}/logo-removebg-preview.png`,
  email: "care@denimique.com",
  telephone: "+919625610749",
  address: {
    "@type": "PostalAddress",
    streetAddress: "H-63, Sector 62",
    addressLocality: "Noida",
    addressRegion: "Uttar Pradesh",
    postalCode: "201301",
    addressCountry: "IN",
  },
  sameAs: ["https://www.facebook.com/share/1EiusSFTyK/"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+919625610749",
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Denimique",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NFFE8RJVV5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NFFE8RJVV5');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1517528553347412');
            fbq('track', 'PageView');
          `}
        </Script> */}
      </head>
      <body
        className={`${dmSans.className} ${dmSans.variable} ${cormorantGaramond.variable} antialiased storefront-theme`}
      >
        {/* <noscript>
         
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1517528553347412&ev=PageView&noscript=1"
          />
        </noscript> */}
        <script
          id="denimique-org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          id="denimique-website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <AuthInitializer>
            <SiteChrome>
              {children}
              <Toaster
                position="top-center"
                gutter={12}
                toastOptions={{
                  duration: 3200,
                  style: {
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#000000",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                    boxShadow: "0 10px 30px rgba(43, 18, 6, 0.14)",
                    border: "1px solid rgba(122, 53, 17, 0.12)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#1B2E27",
                      secondary: "#ffffff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#B3261E",
                      secondary: "#ffffff",
                    },
                  },
                }}
              />
            </SiteChrome>
          </AuthInitializer>
        </GoogleOAuthProvider>

        <DeferredEnhancements />
      </body>
    </html>
  );
}
