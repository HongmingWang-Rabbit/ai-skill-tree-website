import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, Web3Provider } from "@/components/providers";
import { Header } from "@/components/layout";

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
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <Web3Provider>
            <Header />
            <main>{children}</main>
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
