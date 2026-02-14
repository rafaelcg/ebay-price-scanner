import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eBay Price Scanner | Check Market Values & Sold Prices",
  description: "Free eBay price checker. Scan barcodes or search products to see min, max, average sold prices. Find market value for electronics, collectibles, fashion & more.",
  keywords: ["eBay price checker", "sold prices eBay", "market value", "price scanner", "barcode scanner"],
  openGraph: {
    title: "eBay Price Scanner | Check Market Values & Sold Prices",
    description: "Free tool to check eBay sold prices and market values instantly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "eBay Price Scanner",
    description: "Check eBay market values instantly",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://ebay-price-scanner.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "eBay Price Scanner",
              "description": "Free tool to check eBay market values and sold prices",
              "url": "https://ebay-price-scanner.vercel.app",
              "applicationCategory": "ShoppingApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Barcode scanning",
                "Price comparison",
                "Market value analysis",
                "Sold price history"
              ]
            })
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
