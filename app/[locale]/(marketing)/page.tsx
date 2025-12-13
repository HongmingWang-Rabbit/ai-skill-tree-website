"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SearchInput } from "@/components/ui/SearchInput";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  CloseIcon,
  ChevronRightIcon,
  UploadIcon,
  DocumentIcon,
  ResumeIcon,
  ChatIcon,
  ShareIcon,
  SparklesIcon,
} from "@/components/ui/Icons";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import SkillTreeBackground from "@/components/layout/SkillTreeBackground";
import {
  ASSETS,
  HERO_ICON_ROTATION_DURATION,
  API_ROUTES,
  LANDING_PAGE_CONFIG,
} from "@/lib/constants";
import { showToast } from "@/components/ui";
import { normalizeCareerKey } from "@/lib/normalize-career";
import type { CareerSuggestion } from "@/lib/ai";
import {
  DocumentImportModal,
  type ImportResult,
} from "@/components/import/DocumentImportModal";
import type { Locale } from "@/i18n/routing";

// Feature cards configuration (icons must be defined here as they're React components)
const FEATURES = [
  { key: "import", icon: UploadIcon, large: true },
  { key: "skillMaps", icon: SparklesIcon, large: false },
  { key: "resume", icon: ResumeIcon, large: true },
  { key: "chat", icon: ChatIcon, large: false },
  { key: "universe", icon: DocumentIcon, large: false },
  { key: "share", icon: ShareIcon, large: false },
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

// Hero Section
const HeroSection = ({
  t,
  onImportClick,
  onSearch,
  isLoading,
}: {
  t: ReturnType<typeof useTranslations>;
  onImportClick: () => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
}) => (
  <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16">
    <div className="max-w-4xl mx-auto text-center">
      {/* Spinning icon with glow - behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="absolute w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 blur-3xl animate-pulse" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: HERO_ICON_ROTATION_DURATION,
            repeat: Infinity,
            ease: "linear",
          }}
          className="relative"
        >
          <Image
            src={ASSETS.ICON_LARGE}
            alt=""
            width={500}
            height={500}
            className="w-80 h-80 md:w-[40rem] md:h-[40rem] opacity-[0.06]"
            priority
          />
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl md:text-6xl font-bold mb-6 relative z-10"
      >
        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {t("home.hero.title")}
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto relative z-10"
      >
        {t("home.hero.subtitle")}
      </motion.p>

      {/* Primary: Career Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative z-10 w-full max-w-2xl mx-auto"
      >
        <SearchInput
          onSearch={onSearch}
          placeholder={t("home.hero.searchPlaceholder")}
          isLoading={isLoading}
          className="!max-w-none w-full"
        />
      </motion.div>

      {/* Secondary: Import Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="relative z-10 mt-8 flex items-center justify-center gap-2"
      >
        <span className="text-slate-500 text-sm">{t("home.hero.importLabel")}</span>
        <button
          onClick={onImportClick}
          className="px-4 py-2 text-cyan-400 hover:text-white font-medium text-sm transition-all flex items-center gap-2 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 rounded-full"
        >
          <UploadIcon className="w-4 h-4" />
          {t("home.hero.importCta")}
        </button>
      </motion.div>
    </div>
  </section>
);

// Two Paths Section
const TwoPathsSection = ({
  t,
  onImportClick,
  onExploreClick,
}: {
  t: ReturnType<typeof useTranslations>;
  onImportClick: () => void;
  onExploreClick: () => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="py-16 px-4"
  >
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassPanel className="p-8 h-full hover:border-cyan-400/50 transition-all cursor-pointer group">
          <button onClick={onImportClick} className="w-full text-left">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
              <UploadIcon className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
              {t("home.twoPaths.importTitle")}
            </h3>
            <p className="text-slate-400 mb-6">
              {t("home.twoPaths.importDescription")}
            </p>
            <span className="inline-flex items-center gap-2 text-cyan-400 font-medium">
              {t("home.twoPaths.importCta")}
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </GlassPanel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassPanel className="p-8 h-full hover:border-purple-400/50 transition-all cursor-pointer group">
          <button onClick={onExploreClick} className="w-full text-left">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
              <SparklesIcon className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
              {t("home.twoPaths.exploreTitle")}
            </h3>
            <p className="text-slate-400 mb-6">
              {t("home.twoPaths.exploreDescription")}
            </p>
            <span className="inline-flex items-center gap-2 text-purple-400 font-medium">
              {t("home.twoPaths.exploreCta")}
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </GlassPanel>
      </motion.div>
    </div>
  </motion.section>
);

// Workflow Section
const WorkflowSection = ({ t }: { t: ReturnType<typeof useTranslations> }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="py-20 px-4 bg-slate-900/50"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          {t("home.workflow.title")}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {LANDING_PAGE_CONFIG.workflowSteps.map((step, index) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              {/* Connector line */}
              {index < LANDING_PAGE_CONFIG.workflowSteps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-cyan-500/50 via-purple-500/30 to-transparent" />
              )}

              <GlassPanel className="p-6 text-center relative hover:border-cyan-500/30 transition-colors">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-cyan-500/25">
                  {index + 1}
                </div>

                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {t(`home.workflow.${step.key}Title`)}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t(`home.workflow.${step.key}Description`)}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Features Section
const FeaturesSection = ({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6 }}
    className="py-20 px-4"
  >
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12 text-white">
        {t("home.features.title")}
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={feature.large ? "md:row-span-1" : ""}
            >
              <GlassPanel
                className={`p-6 h-full transition-all duration-300 ${
                  feature.large ? "border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10" : "hover:border-slate-600"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    feature.large
                      ? "bg-cyan-500/20"
                      : "bg-slate-700/50"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      feature.large ? "text-cyan-400" : "text-slate-400"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {t(`home.features.${feature.key}.title`)}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t(`home.features.${feature.key}.description`)}
                </p>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </div>
  </motion.section>
);

// Demo Preview Section
const DemoPreviewSection = ({
  t,
  onCtaClick,
}: {
  t: ReturnType<typeof useTranslations>;
  onCtaClick: () => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="py-20 px-4 bg-slate-900/50"
  >
    <div className="max-w-6xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-4 text-white">
        {t("home.demo.title")}
      </h2>
      <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
        {t("home.demo.description")}
      </p>

      <GlassPanel className="p-8 mb-8">
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Center node */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full flex items-center justify-center text-center p-4 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="font-bold text-white text-sm">
                  {t("home.demo.coreSkill")}
                </span>
              </motion.div>
            </motion.div>

            {/* Orbital skills */}
            {[...Array(LANDING_PAGE_CONFIG.demo.orbitalSkillCount)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                animate={{
                  scale: [1, 1.08, 1],
                }}
                viewport={{ once: true }}
                transition={{
                  duration: LANDING_PAGE_CONFIG.animation.duration,
                  delay: 0.4 + i * LANDING_PAGE_CONFIG.animation.staggerDelay,
                  scale: {
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${
                    (i / LANDING_PAGE_CONFIG.demo.orbitalSkillCount) * 360
                  }deg) translate(${LANDING_PAGE_CONFIG.demo.orbitalRadius}) rotate(-${(i / LANDING_PAGE_CONFIG.demo.orbitalSkillCount) * 360}deg)`,
                }}
                className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center text-center p-2 border border-purple-500/30 hover:bg-purple-500/30 hover:border-purple-400/50 transition-colors cursor-default"
              >
                <span className="text-xs text-white">
                  {t("home.demo.relatedSkill")}
                </span>
              </motion.div>
            ))}

            {/* Connection lines */}
            {[...Array(LANDING_PAGE_CONFIG.demo.orbitalSkillCount)].map((_, i) => (
              <motion.div
                key={`line-${i}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.3 }}
                viewport={{ once: true }}
                transition={{ duration: LANDING_PAGE_CONFIG.animation.duration, delay: 0.6 + i * 0.05 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: LANDING_PAGE_CONFIG.demo.connectionLineWidth,
                  height: "2px",
                  background:
                    "linear-gradient(90deg, rgba(6, 182, 212, 0.5), rgba(147, 51, 234, 0.5))",
                  transformOrigin: "left center",
                  transform: `rotate(${(i / LANDING_PAGE_CONFIG.demo.orbitalSkillCount) * 360}deg)`,
                }}
              />
            ))}
          </div>
        </div>
      </GlassPanel>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.8 }}
        onClick={onCtaClick}
        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all duration-200"
      >
        {t("home.demo.cta")}
      </motion.button>
    </div>
  </motion.section>
);

// Stats Section
const StatsSection = ({ t }: { t: ReturnType<typeof useTranslations> }) => (
  <motion.section
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="py-16 px-4"
  >
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {LANDING_PAGE_CONFIG.stats.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="text-center group"
          >
            <motion.div
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {stat.value}
            </motion.div>
            <div className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
              {t(`home.stats.${stat.key}`)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.section>
);

// Secondary CTA Section - Featured Careers
const SecondaryCTASection = ({
  t,
  handleFeaturedClick,
}: {
  t: ReturnType<typeof useTranslations>;
  handleFeaturedClick: (key: string) => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="py-16 px-4 bg-slate-900/50"
  >
    <div className="max-w-4xl mx-auto text-center">
      <p className="text-slate-400 mb-6">
        {t("home.secondaryCta.popularCareers")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {LANDING_PAGE_CONFIG.featuredCareers.map((career, index) => (
          <motion.button
            key={career.key}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.3,
              delay: 0.1 + index * 0.05,
            }}
            onClick={() => handleFeaturedClick(career.key)}
            className="px-5 py-2.5 rounded-full bg-slate-800/70 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 border border-slate-700 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-2 shadow-lg shadow-black/20"
          >
            <span className="text-lg">{career.icon}</span>
            <span className="font-medium">{t(`featuredCareers.${career.titleKey}`)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.section>
);

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CareerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const secondaryCtaRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ROUTES.AI_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, locale }),
      });
      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.type === "specific") {
          router.push(`/career/${result.data.career.canonicalKey}`);
        } else if (result.data.type === "suggestions") {
          setSuggestions(result.data.suggestions);
          setShowSuggestions(true);
          setIsLoading(false);
        }
      } else {
        router.push(`/career/${normalizeCareerKey(query)}`);
      }
    } catch {
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

  const handleImportComplete = async (result: ImportResult) => {
    setShowImportModal(false);

    try {
      // Create a new map from the imported skills
      const response = await fetch(API_ROUTES.MAP_FORK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.suggestedTitle,
          customNodes: result.nodes,
          customEdges: result.edges,
          locale,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.mapId) {
        // Also update user profile if bio or experience was extracted
        if (result.bio || result.experience?.length) {
          await fetch(API_ROUTES.USER_PROFILE, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bio: result.bio,
              experience: result.experience,
            }),
          });
        }
        router.push(`/career/${data.data.mapId}`);
      } else {
        showToast.error(t("import.createFailed"));
      }
    } catch {
      showToast.error(t("import.createFailed"));
    }
  };

  const scrollToExplore = () => {
    secondaryCtaRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <HeroSection
          t={t}
          onImportClick={() => setShowImportModal(true)}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        <TwoPathsSection
          t={t}
          onImportClick={() => setShowImportModal(true)}
          onExploreClick={scrollToExplore}
        />

        <WorkflowSection t={t} />

        <FeaturesSection t={t} />

        <DemoPreviewSection
          t={t}
          onCtaClick={() => setShowImportModal(true)}
        />

        <StatsSection t={t} />

        <div ref={secondaryCtaRef}>
          <SecondaryCTASection
            t={t}
            handleFeaturedClick={handleFeaturedClick}
          />
        </div>

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
        </motion.footer>

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

        {/* Import Modal */}
        <DocumentImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
          locale={locale}
          mode="create"
        />
      </div>
    </motion.main>
  );
}
