"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SearchInput } from "@/components/ui/SearchInput";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CloseIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import SkillTreeBackground from "@/components/layout/SkillTreeBackground";
import { ASSETS, HERO_ICON_ROTATION_DURATION } from "@/lib/constants";
import { normalizeCareerKey } from "@/lib/normalize-career";
import type { CareerSuggestion } from "@/lib/ai";

const FEATURED_CAREERS = [
  { titleKey: "frontendDeveloper", icon: "💻", key: "frontend-developer" },
  { titleKey: "dataScientist", icon: "📊", key: "data-scientist" },
  { titleKey: "uxDesigner", icon: "🎨", key: "ux-designer" },
  { titleKey: "devopsEngineer", icon: "⚙️", key: "devops-engineer" },
  { titleKey: "productManager", icon: "📋", key: "product-manager" },
  { titleKey: "mlEngineer", icon: "🤖", key: "machine-learning-engineer" },
];

// Suggestions modal component
const SuggestionsModal = ({
  suggestions,
  onSelect,
  onClose,
  t,
}: {
  suggestions: CareerSuggestion[];
  onSelect: (suggestion: CareerSuggestion) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
    >
      <GlassPanel className="max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {t("home.suggestions.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <CloseIcon className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <p className="text-slate-400 mb-6">{t("home.suggestions.subtitle")}</p>
        <div className="grid gap-3">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.canonicalKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(suggestion)}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-cyan-400/50 rounded-xl text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{suggestion.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {suggestion.description}
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </GlassPanel>
    </motion.div>
  </motion.div>
);

const Hero = ({
  t,
  handleSearch,
  isLoading,
  handleFeaturedClick,
}: {
  t: ReturnType<typeof useTranslations>;
  handleSearch: (query: string) => void;
  isLoading: boolean;
  handleFeaturedClick: (key: string) => void;
}) => (
  <section className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 md:pt-40">
    <div className="max-w-4xl mx-auto text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-5xl md:text-6xl font-bold mb-6"
      >
        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {t("home.title")}
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto"
      >
        {t("home.subtitle")}
      </motion.p>
      {/* Search input with spinning icon behind */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative flex justify-center mb-16 w-full"
      >
        {/* Spinning icon with glow - behind search */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Glow effect */}
          <div className="absolute w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-3xl animate-pulse" />
          <div
            className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-2xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          {/* Spinning icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: HERO_ICON_ROTATION_DURATION, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Image
              src={ASSETS.ICON_LARGE}
              alt=""
              width={500}
              height={500}
              className="w-80 h-80 md:w-[50rem] md:h-[50rem] opacity-[0.08]"
              priority
            />
          </motion.div>
        </div>

        {/* Search input - on top */}
        <div className="relative z-10 w-full max-w-3xl px-4">
          <SearchInput
            onSearch={handleSearch}
            placeholder={t("home.searchPlaceholder")}
            isLoading={isLoading}
            className="!max-w-none"
          />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <p className="text-sm text-slate-500 mb-4">
          {t("home.popularCareers")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {FEATURED_CAREERS.map((career, index) => (
            <motion.button
              key={career.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: 1.2 + index * 0.1,
              }}
              onClick={() => handleFeaturedClick(career.key)}
              className="px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <span>{career.icon}</span>
              <span>{t(`featuredCareers.${career.titleKey}`)}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>{" "}
    </div>
  </section>
);

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CareerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, locale }),
      });
      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.type === "specific") {
          // Specific career - navigate directly
          router.push(`/career/${result.data.career.canonicalKey}`);
        } else if (result.data.type === "suggestions") {
          // Vague query - show suggestions
          setSuggestions(result.data.suggestions);
          setShowSuggestions(true);
          setIsLoading(false);
        }
      } else {
        // Fallback: treat as direct career search
        router.push(`/career/${normalizeCareerKey(query)}`);
      }
    } catch {
      // Fallback on error: treat as direct career search
      router.push(`/career/${normalizeCareerKey(query)}`);
    }
  };

  const handleFeaturedClick = (key: string) => {
    router.push(`/career/${key}`);
  };

  const handleSuggestionSelect = (suggestion: CareerSuggestion) => {
    setShowSuggestions(false);
    setIsLoading(true);
    router.push(`/career/${suggestion.canonicalKey}`);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col relative overflow-hidden bg-slate-900"
    >
      <SkillTreeBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Hero
          t={t}
          handleSearch={handleSearch}
          isLoading={isLoading}
          handleFeaturedClick={handleFeaturedClick}
        />
        {/* Suggestions Modal */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <SuggestionsModal
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
              t={t}
            />
          )}
        </AnimatePresence>
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
              {t("home.howItWorks")}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🔍",
                  titleKey: "home.search.title",
                  descriptionKey: "home.search.description",
                },
                {
                  icon: "🤖",
                  titleKey: "home.generate.title",
                  descriptionKey: "home.generate.description",
                },
                {
                  icon: "📈",
                  titleKey: "home.track.title",
                  descriptionKey: "home.track.description",
                },
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
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      {t(feature.titleKey)}
                    </h3>
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
              {t("home.skillTreePreview.title")}
            </h2>
            <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
              {t("home.skillTreePreview.description")}
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
                      {t("home.skillTreePreview.coreSkill")}
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
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${
                          (i / 5) * 360
                        }deg) translate(12rem) rotate(-${(i / 5) * 360}deg)`,
                      }}
                      className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center text-center p-2"
                    >
                      <span className="text-sm text-white">
                        {t("home.skillTreePreview.relatedSkill")}
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
              {t("home.footer")}
              <span className="mx-2">•</span>
              {t("home.footerPowered")}
            </p>
          </div>
        </motion.footer>{" "}
      </div>
    </motion.main>
  );
}
