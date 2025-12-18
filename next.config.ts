import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  transpilePackages: ['@react-pdf/renderer'],
  // Exclude pdf-parse and pdfjs-dist from server bundling to avoid worker issues
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  // Exclude unnecessary files from serverless function bundles
  outputFileTracingExcludes: {
    '*': [
      '.next/cache/**/*',
      '.pnpm-store/**/*',
      '.git/**/*',
      'node_modules/@swc/**/*',
      'node_modules/esbuild/**/*',
    ],
  },
};

export default withNextIntl(nextConfig);
