import type { ReactNode } from "react";

// Login is a client page, so its SEO tags live in this server layout.
// Auth pages stay out of Google on purpose.
export const metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
