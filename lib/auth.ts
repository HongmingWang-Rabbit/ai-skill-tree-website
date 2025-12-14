import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { users, accounts, sessions, verificationTokens } from './db/schema';
import { eq } from 'drizzle-orm';
import { SiweMessage } from 'siwe';
import WeChatProvider, { WeChatMPProvider } from './wechat-provider';
import { initializeUserCredits } from './credits';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      walletAddress?: string | null;
    };
  }
  interface User {
    walletAddress?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as NextAuthOptions['adapter'],

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
    // WeChat Web QR code login (for desktop browsers)
    ...(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET
      ? [
          WeChatProvider({
            clientId: process.env.WECHAT_APP_ID,
            clientSecret: process.env.WECHAT_APP_SECRET,
          }),
          // WeChat in-app browser login
          WeChatMPProvider({
            clientId: process.env.WECHAT_APP_ID,
            clientSecret: process.env.WECHAT_APP_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'web3',
      name: 'Web3 Wallet',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            return null;
          }

          const siwe = new SiweMessage(JSON.parse(credentials.message));
          const result = await siwe.verify({
            signature: credentials.signature,
          });

          if (!result.success) {
            return null;
          }

          const address = siwe.address.toLowerCase();

          // Find or create user with this wallet
          let user = await db.query.users.findFirst({
            where: eq(users.walletAddress, address),
          });

          if (!user) {
            const [newUser] = await db.insert(users).values({
              walletAddress: address,
              name: `${address.slice(0, 6)}...${address.slice(-4)}`,
            }).returning();
            user = newUser;
            // Initialize credits for new Web3 users
            await initializeUserCredits(user.id);
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            walletAddress: user.walletAddress,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.walletAddress = token.walletAddress as string | null;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
  },

  events: {
    // Initialize credits for new OAuth users (Google, Twitter, WeChat)
    createUser: async ({ user }) => {
      if (user.id) {
        await initializeUserCredits(user.id);
      }
    },
  },
};
