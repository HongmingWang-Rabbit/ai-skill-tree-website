'use client';

import { signIn } from 'next-auth/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'social' | 'web3'>('social');
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Handle Web3 sign-in after wallet connection
  useEffect(() => {
    if (isConnected && address && activeTab === 'web3' && !isSigningIn) {
      handleWeb3SignIn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, activeTab]);

  const handleWeb3SignIn = async () => {
    if (!address || isSigningIn) return;

    setIsSigningIn(true);
    try {
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to AI Skill Tree',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce: Math.random().toString(36).substring(2),
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const result = await signIn('web3', {
        message: JSON.stringify(message),
        signature,
        redirect: false,
      });

      if (result?.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Web3 sign-in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isOpen) return null;

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
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to track your skill progress</p>
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
            Social Login
          </button>
          <button
            onClick={() => setActiveTab('web3')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'web3'
                ? 'bg-amber-500 text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Web3 Wallet
          </button>
        </div>

        {/* Content */}
        {activeTab === 'social' ? (
          <div className="space-y-3">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => signIn('twitter', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black hover:bg-slate-800 text-white font-medium rounded-lg transition-colors border border-slate-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Continue with X
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 text-center mb-4">
              Connect your wallet to sign in securely
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
            {isConnected && isSigningIn && (
              <p className="text-sm text-amber-400 text-center mt-4">
                Please sign the message in your wallet...
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
