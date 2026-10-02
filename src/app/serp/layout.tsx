import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Live Google SERP Research",
  description:
    "Check live Google search results, People Also Ask questions, and related searches for any keyword.",
  alternates: { canonical: "/serp" },
};

export default function SerpLayout({ children }: { children: ReactNode }) {
  return children;
}
