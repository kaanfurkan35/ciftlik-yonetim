import "@/lib/env";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as never,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { success } = rateLimit(
          `login:${credentials.email}`,
          5,
          15 * 60 * 1000
        );
        if (!success) {
          throw new Error(
            "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin."
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { farm: true },
        });

        if (!user || !user.isActive || user.deletedAt) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          farmId: user.farmId,
          farmName: user.farm.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as Record<string, unknown>).role as UserRole;
        token.farmId = (user as unknown as Record<string, unknown>).farmId as string;
        token.farmName = (user as unknown as Record<string, unknown>).farmName as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.farmId = token.farmId as string;
        session.user.farmName = token.farmName as string;
      }
      return session;
    },
  },
});
