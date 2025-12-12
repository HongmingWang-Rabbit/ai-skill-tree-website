import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Builder - AI-Powered Skill Trees",
  description: "Discover and visualize your career path with AI-generated skill trees. Explore the skills you need to master your dream career.",
  keywords: ["career", "skills", "skill tree", "career path", "AI", "learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: lang attribute is set in [locale]/layout.tsx based on URL params
  // to avoid hydration mismatch
  return children;
}
