import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";



import { getSiteUrl, getSiteUrlObject } from "@/lib/site-url";

// Root layout: wraps every page (navbar + metadata).
// Includes OG/Twitter cards, robots rules and canonical URL for SEO.

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SEO Content Writer";

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: {
    default: `${APP_NAME} — Research, write, publish`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Upload your keywords once, pick a topic, and get a researched, publish-ready SEO article with meta tags, schema, internal links and image prompts in minutes.",
  keywords: ["SEO content writer", "AI SEO content", "keyword to article", "content generation", "SEO tool India"],
  authors: [{ name: APP_NAME }],
  openGraph: {
    type: "website",
    url: getSiteUrl(),
    siteName: APP_NAME,
    title: `${APP_NAME} — Research, write, publish`,
    description:
      "Simple English. Real research. Publish-ready SEO articles with meta tags, schema and internal links.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Research, write, publish`,
    description: "Publish-ready SEO articles in minutes — with meta tags, schema and internal links.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Navigation
          user={
            user
              ? {
                  id: user.id,
                  name: user.email,
                  email: user.email,
                  credits: user.credits ?? 0,
                  role: user.role,
                }
              : null
          }
        />
        <main>{children}</main> <Footer /> <Analytics />
      </body>
    </html>
  );
}
