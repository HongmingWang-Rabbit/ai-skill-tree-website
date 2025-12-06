import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'AI Skill Tree',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: true,
});
