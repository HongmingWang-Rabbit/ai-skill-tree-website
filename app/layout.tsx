import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Skill Map - AI-Powered Career Skill Maps",
  description: "Discover and visualize your career path with AI-generated skill maps. Explore the skills you need to master your dream career.",
  keywords: ["career", "skills", "skill map", "career path", "AI", "learning", "personal development"],
  icons: {
    icon: [
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
