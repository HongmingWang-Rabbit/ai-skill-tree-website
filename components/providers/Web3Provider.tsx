'use client';

import { useState, useEffect } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [wagmiConfig, setWagmiConfig] = useState<Awaited<typeof import('@/lib/wagmi')>['wagmiConfig'] | null>(null);

  useEffect(() => {
    // Dynamically import wagmi config only on client side
    import('@/lib/wagmi').then((module) => {
      setWagmiConfig(module.wagmiConfig);
      setMounted(true);
    });
  }, []);

  // Render children without Web3 providers during SSR and initial mount
  if (!mounted || !wagmiConfig) {
    return <>{children}</>;
  }

  // Note: QueryClientProvider is now provided by QueryProvider at the root level
  // WagmiProvider will use the parent QueryClient
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#C9A227',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          fontStack: 'system',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
