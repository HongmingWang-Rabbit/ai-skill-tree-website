'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { UserMenu } from '../auth/UserMenu';
import { AuthModal } from '../auth/AuthModal';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export function Header() {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span className="text-2xl">🌳</span>
              <span className="font-bold text-lg hidden sm:block">{t('header.brandName')}</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t('common.home')}
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t('common.dashboard')}
              </Link>
              <Link
                href="/"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t('common.explore')}
              </Link>
            </nav>

            {/* Auth Section & Language Switcher */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
              ) : session ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm"
                >
                  {t('common.signIn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
