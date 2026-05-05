import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Single Product Landing",
  description: "Landing page with admin-managed product data"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
