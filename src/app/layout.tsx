import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CommandPalette } from '@/components/dashboard/command-palette'
import { AnimatedBackground } from "@/components/home/animated-background";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkvault.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3D52A0" },
    { media: "(prefers-color-scheme: dark)", color: "#2E3F80" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "LinkVault — Smart URL Shortener with Analytics",
    template: "%s | LinkVault",
  },
  description:
    "Shorten URLs, create branded links, track analytics, and generate QR codes — all in one powerful platform. Free to start.",
  keywords: [
    "URL shortener",
    "link shortener",
    "QR code generator",
    "link analytics",
    "custom slug",
    "branded links",
    "link management",
    "short link",
    "redirect",
    "tracking links",
  ],
  authors: [{ name: "LinkVault" }],
  creator: "LinkVault",
  publisher: "LinkVault",
  applicationName: "LinkVault",
  category: "Technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "LinkVault",
    title: "LinkVault — Smart URL Shortener with Analytics",
    description:
      "Shorten URLs, create branded links, track analytics, and generate QR codes — all in one powerful platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinkVault — Smart URL Shortener",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkVault — Smart URL Shortener with Analytics",
    description:
      "Shorten URLs, create branded links, track analytics, and generate QR codes.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LinkVault",
    description:
      "Smart URL shortener with analytics, custom slugs, and QR code generation.",
    url: BASE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available with paid Pro upgrades",
    },
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="page-dot-grid relative min-h-full flex flex-col font-sans">
        <AnimatedBackground />
        {children}
        <CommandPalette />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
