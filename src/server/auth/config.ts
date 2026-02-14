import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "~/server/db";

import type { OAuthConfig } from "next-auth/providers";
import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

const FreeeProvider: OAuthConfig<any> = {
  id: "freee",
  name: "freee",
  type: "oauth",
  authorization: {
    url: "https://accounts.secure.freee.co.jp/public_api/authorize",
    params: {
      scope: "read",
    },
  },
  token: "https://accounts.secure.freee.co.jp/public_api/token",
  userinfo: {
    async request() {
      return { id: "freee-user" };
    },
  },
  clientId: env.FREEE_CLIENT_ID,
  clientSecret: env.FREEE_CLIENT_SECRET,
  profile() {
    return {
      id: "freee-user",
      name: "freee-user",
      email: null,
    };
  },
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider,
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    async jwt({ token, account }) {
      // 初回ログイン時
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
