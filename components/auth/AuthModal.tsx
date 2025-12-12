'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { CloseIcon, WeChatIcon, GoogleIcon } from '@/components/ui/Icons';
import { isWeChatBrowser } from '@/lib/wechat-provider';
import { AUTH_CALLBACK_URL, PROVIDER_COLORS } from '@/lib/constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Dynamically import the Web3 login tab to avoid SSR issues with wagmi hooks
const Web3LoginTab = dynamic(() => import('./Web3LoginTab').then(mod => ({ default: mod.Web3LoginTab })), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const t = useTranslations('auth');
  const [activeTab, setActiveTab] = useState<'social' | 'web3'>('social');
  const [isInWeChatBrowser, setIsInWeChatBrowser] = useState(false);
  const [isWeChatEnabled, setIsWeChatEnabled] = useState(false);

  // Detect WeChat browser and check if WeChat provider is available
  useEffect(() => {
    setIsInWeChatBrowser(isWeChatBrowser());

    // Check if WeChat provider is configured
    getProviders().then((providers) => {
      if (providers && ('wechat' in providers || 'wechat-mp' in providers)) {
        setIsWeChatEnabled(true);
      }
    });
  }, []);

  if (!isOpen) return null;

  // Handle WeChat login - use different provider based on browser
  const handleWeChatLogin = () => {
    const provider = isInWeChatBrowser ? 'wechat-mp' : 'wechat';
    signIn(provider, { callbackUrl: AUTH_CALLBACK_URL });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{t('welcomeBack')}</h2>
          <p className="text-slate-400 text-sm">{t('signInDescription')}</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'social'
                ? 'bg-amber-500 text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('socialLogin')}
          </button>
          <button
            onClick={() => setActiveTab('web3')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'web3'
                ? 'bg-amber-500 text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('web3Wallet')}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'social' ? (
          <div className="space-y-3">
            {/* Google Login */}
            <button
              onClick={() => signIn('google', { callbackUrl: AUTH_CALLBACK_URL })}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <GoogleIcon className="w-5 h-5" />
              {t('continueWithGoogle')}
            </button>

            {/* WeChat Login - only show if configured */}
            {isWeChatEnabled && (
              <button
                onClick={handleWeChatLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 text-white font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: PROVIDER_COLORS.WECHAT.bg,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PROVIDER_COLORS.WECHAT.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PROVIDER_COLORS.WECHAT.bg}
              >
                <WeChatIcon className="w-5 h-5" />
                {t('continueWithWeChat')}
              </button>
            )}
          </div>
        ) : (
          <Web3LoginTab onClose={onClose} />
        )}

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          {t('termsNotice')}
        </p>
      </div>
    </div>
  );
}
