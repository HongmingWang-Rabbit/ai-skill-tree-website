'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput } from '@/components/ui/SearchInput';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { normalizeCareerKey } from '@/lib/normalize-career';

const FEATURED_CAREERS = [
  { title: 'Frontend Developer', icon: '💻', key: 'frontend-developer' },
  { title: 'Data Scientist', icon: '📊', key: 'data-scientist' },
  { title: 'UX Designer', icon: '🎨', key: 'ux-designer' },
  { title: 'DevOps Engineer', icon: '⚙️', key: 'devops-engineer' },
  { title: 'Product Manager', icon: '📋', key: 'product-manager' },
  { title: 'Machine Learning Engineer', icon: '🤖', key: 'machine-learning-engineer' },
];

export default function HomePage() {
  const router = useRouter();
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
              Career Builder
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Discover your career path with AI-powered skill trees.
            Visualize the skills you need to master your dream career.
          </p>

          {/* Search */}
          <div className="flex justify-center mb-16">
            <SearchInput
              onSearch={handleSearch}
              placeholder="Enter a career (e.g., Software Engineer)"
              isLoading={isLoading}
            />
          </div>

          {/* Featured Careers */}
          <div>
            <p className="text-sm text-slate-500 mb-4">Popular careers to explore</p>
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
                  <span>{career.title}</span>
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
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <GlassPanel className="p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Search</h3>
              <p className="text-slate-400">
                Enter any career path you want to explore. Our AI understands thousands of roles.
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Generate</h3>
              <p className="text-slate-400">
                AI generates a comprehensive skill tree with all the skills you need to master.
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Track</h3>
              <p className="text-slate-400">
                Visualize your progress as you unlock skills and level up your career.
              </p>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
          <p>
            Built with Next.js, React Flow, and OpenAI.
            <span className="mx-2">•</span>
            Powered by AI skill tree generation.
          </p>
        </div>
      </footer>
    </main>
  );
}
