"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { UserMenu } from "../auth/UserMenu";
import { AuthModal } from "../auth/AuthModal";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { motion } from "framer-motion";
import Image from "next/image";
import { ASSETS, HEADER_SCROLL_THRESHOLD, APP_NAME } from "@/lib/constants";

export function Header() {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > HEADER_SCROLL_THRESHOLD);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-900/80 backdrop-blur-md border-b border-slate-800"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled ? "h-16" : "h-20"
            }`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center">
                <Image
                  src={ASSETS.ICON}
                  alt={APP_NAME}
                  width={100}
                  height={100}
                  className="w-7 h-7 scale-200"
                />
              </div>
              <span className="font-bold text-lg hidden sm:block text-white">
                {t("header.brandName")}
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t("common.home")}
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t("common.dashboard")}
              </Link>
              <Link
                href="/"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t("common.explore")}
              </Link>
            </nav>

            {/* Auth Section & Language Switcher */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {status === "loading" ? (
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
              ) : session ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden md:block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm"
                >
                  {t("common.signIn")}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 left-0 right-0 z-40 md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800"
        >
          <nav className="flex flex-col p-4 gap-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm px-4 py-3 rounded-lg"
            >
              {t("common.home")}
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm px-4 py-3 rounded-lg"
            >
              {t("common.dashboard")}
            </Link>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm px-4 py-3 rounded-lg"
            >
              {t("common.explore")}
            </Link>
            {!session && status !== "loading" && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="mt-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm"
              >
                {t("common.signIn")}
              </button>
            )}
          </nav>
        </motion.div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
