'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SearchInput } from '@/components/ui/SearchInput';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { normalizeCareerKey } from '@/lib/normalize-career';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';

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
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      {/* Background Gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-zinc-900 to-blue-900 opacity-30"
      ></motion.div>
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Brand */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                          className="mb-8"
                        >
                          <span className="text-6xl">🎯</span>
                        </motion.div>
            {/* Headline */}
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                          className="text-5xl md:text-6xl font-bold mb-6"
                        >
                          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {t('home.title')}
                          </span>
                        </motion.h1>
            {/* Subheadline */}
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                          className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto"
                        >
                          {t('home.subtitle')}
                        </motion.p>
            {/* Search */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                          className="flex justify-center mb-16"
                        >
                          <SearchInput
                            onSearch={handleSearch}
                            placeholder={t('home.searchPlaceholder')}
                            isLoading={isLoading}
                          />
                        </motion.div>
            {/* Featured Careers */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 1 }}
                        >
                          <p className="text-sm text-slate-500 mb-4">{t('home.popularCareers')}</p>
                          <div className="flex flex-wrap justify-center gap-3">
                            {FEATURED_CAREERS.map((career, index) => (
                              <motion.button
                                key={career.key}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
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
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>          </div>
        </section>

              {/* Features Section */}
              <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="py-20 px-4 bg-slate-900/50"
              >
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-3xl font-bold text-center mb-12 text-white">
                    {t('home.howItWorks')}
                  </h2>
        
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      { icon: '🔍', titleKey: 'home.search.title', descriptionKey: 'home.search.description' },
                      { icon: '🤖', titleKey: 'home.generate.title', descriptionKey: 'home.generate.description' },
                      { icon: '📈', titleKey: 'home.track.title', descriptionKey: 'home.track.description' },
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.titleKey}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                      >
                        <GlassPanel className="p-6 text-center">
                          <div className="text-4xl mb-4">{feature.icon}</div>
                          <h3 className="text-xl font-semibold mb-2 text-white">{t(feature.titleKey)}</h3>
                          <p className="text-slate-400">
                            {t(feature.descriptionKey)}
                          </p>
                        </GlassPanel>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
      {/* Skill Tree Preview Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            {t('home.skillTreePreview.title')}
          </h2>
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
            {t('home.skillTreePreview.description')}
          </p>
          <GlassPanel className="p-8">
            <div className="flex items-center justify-center">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-32 h-32 bg-cyan-500/20 rounded-full flex items-center justify-center text-center p-4"
                >
                  <span className="font-bold text-white">
                    {t('home.skillTreePreview.coreSkill')}
                  </span>
                </motion.div>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + i * 0.1,
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${
                        (i / 5) * 360
                      }deg) translate(12rem) rotate(-${
                        (i / 5) * 360
                      }deg)`,
                    }}
                    className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center text-center p-2"
                  >
                    <span className="text-sm text-white">
                      {t('home.skillTreePreview.relatedSkill')}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </motion.section>
              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="py-8 px-4 border-t border-slate-800"
              >
                <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
                  <p>
                    {t('home.footer')}
                    <span className="mx-2">•</span>
                    {t('home.footerPowered')}
                  </p>
                </div>
              </motion.footer>      </div>
    </motion.main>
  );
}
