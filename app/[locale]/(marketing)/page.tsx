'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { normalizeCareerKey } from '@/lib/normalize-career';
import { useRouter } from '@/i18n/navigation';

const FEATURED_CAREERS = [
  { titleKey: 'frontendDeveloper', icon: '💻', key: 'frontend-developer' },
  { titleKey: 'dataScientist', icon: '📊', key: 'data-scientist' },
  { titleKey: 'uxDesigner', icon: '🎨', key: 'ux-designer' },
  { titleKey: 'devopsEngineer', icon: '⚙️', key: 'devops-engineer' },
  { titleKey: 'productManager', icon: '📋', key: 'product-manager' },
  { titleKey: 'mlEngineer', icon: '🤖', key: 'machine-learning-engineer' },
];

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    const key = normalizeCareerKey(query);
    router.push(`/career/${key}`);
  };

  const handleFeaturedClick = (key: string) => {
    router.push(`/career/${key}`);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <span className="text-6xl">🎯</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('home.title')}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>

          {/* Search */}
          <div className="flex justify-center mb-16">
            <SearchInput
              onSearch={handleSearch}
              placeholder={t('home.searchPlaceholder')}
              isLoading={isLoading}
            />
          </div>

          {/* Featured Careers */}
          <div>
            <p className="text-sm text-slate-500 mb-4">{t('home.popularCareers')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {FEATURED_CAREERS.map((career) => (
                <button
                  key={career.key}
                  onClick={() => handleFeaturedClick(career.key)}
                  className="
                    px-4 py-2 rounded-full
                    bg-slate-800/50 hover:bg-slate-700/50
                    border border-slate-700 hover:border-cyan-400/50
                    text-slate-300 hover:text-white
                    transition-all duration-200
                    flex items-center gap-2
                  "
                >
                  <span>{career.icon}</span>
                  <span>{t(`featuredCareers.${career.titleKey}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            {t('home.howItWorks')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <GlassPanel className="p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2 text-white">{t('home.search.title')}</h3>
              <p className="text-slate-400">
                {t('home.search.description')}
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2 text-white">{t('home.generate.title')}</h3>
              <p className="text-slate-400">
                {t('home.generate.description')}
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2 text-white">{t('home.track.title')}</h3>
              <p className="text-slate-400">
                {t('home.track.description')}
              </p>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
          <p>
            {t('home.footer')}
            <span className="mx-2">•</span>
            {t('home.footerPowered')}
          </p>
        </div>
      </footer>
    </main>
  );
}
