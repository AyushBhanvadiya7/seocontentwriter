import type { ReactNode } from "react";

// Pricing is a client page, so its SEO tags live in this server layout.
export const metadata = {
  title: "Pricing",
  description:
    "Simple credit packs in Indian Rupees. 1 credit = 1 article. Paid credits never expire. Start free with 10 credits.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
