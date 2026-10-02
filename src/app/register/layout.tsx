import type { ReactNode } from "react";

// Register is a client page, so its SEO tags live in this server layout.
// Auth pages stay out of Google on purpose.
export const metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
