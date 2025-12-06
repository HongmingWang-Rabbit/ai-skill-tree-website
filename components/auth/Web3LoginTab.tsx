'use client';

import { signIn } from 'next-auth/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';

interface Web3LoginTabProps {
  onClose: () => void;
}

export function Web3LoginTab({ onClose }: Web3LoginTabProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Handle Web3 sign-in after wallet connection
  useEffect(() => {
    if (isConnected && address && !isSigningIn) {
      handleWeb3SignIn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

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

  return (
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
  );
}
