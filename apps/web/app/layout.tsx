import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  title: "GitSense — AI Developer Workspace",
  description:
    "Understand any GitHub repository like a senior engineer. Inspect code, ask codebase-aware questions, summarize commits, and generate docs from one focused developer cockpit.",
  keywords: ["GitHub", "AI", "developer tools", "code analysis", "repository intelligence", "commit intelligence"],
  authors: [{ name: "GitSense" }],
  openGraph: {
    title: "GitSense — AI Developer Workspace",
    description: "Understand any GitHub repository like a senior engineer.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
