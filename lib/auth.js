import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { userByEmail, initDb } from './mongoDb';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await initDb();
        const user = await userByEmail(credentials.email);
        if (!user) return null;
        const valid = bcrypt.compareSync(credentials.password, user.password_hash);
        if (!valid) return null;
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shop_id ? String(user.shop_id) : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.shopId = user.shopId;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.shopId = token.shopId;
      session.user.userId = token.userId;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'stockeasy-secret-2024',
};
