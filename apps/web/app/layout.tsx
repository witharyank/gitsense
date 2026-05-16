import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitSense",
  description: "AI developer workspace for GitHub repositories"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
