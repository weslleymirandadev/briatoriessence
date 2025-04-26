import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import prisma from "../../../../../prisma";

interface JWT {
  id: string;
  role: string;
  name?: string | null;
  email: string;
  picture?: string | null;
  exp?: number;
}

interface CustomUser extends User {
  id: string;
  role: string;
}

async function findOrCreateUser(
  email: string,
  name: string,
  image?: string,
  password?: string
) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user && password) {
    const hashedPassword = await hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        name,
        image,
        password: hashedPassword,
        role:
          email == process.env.NEXT_PUBLIC_ADMIN_EMAIL1 || email == process.env.NEXT_PUBLIC_ADMIN_EMAIL2
            ? "admin"
            : "user",
      },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        image,
        password: "",
        role:
          email == process.env.ADMIN_EMAIL1 || email == process.env.ADMIN_EMAIL2
            ? "admin"
            : "user",
      },
    });
  }

  return user;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: { secret: process.env.NEXTAUTH_SECRET },
  pages: { signIn: "/autenticar/login" },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email || profile?.email;
      const name = user.name || profile?.name;
      const image = (profile as { picture?: string })?.picture || user.image!;
      if (!email) throw new Error("Email não encontrado.");

      const dbUser = await findOrCreateUser(email, name!, image);
      if (!dbUser) throw new Error("Erro ao criar usuário.");

      user.id = dbUser.id;
      user.role = dbUser.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image || "";
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { name?: string | null };
      user: CustomUser;
      newSession: any;
      trigger: "update";
    }) {
      session.user = {
        id: token.id as string,
        role: token.role as string,
        name: token.name || undefined, // Converte null para undefined
        email: token.email as string,
        image: token.picture || undefined,
      };
      session.expires = token.exp
        ? new Date(token.exp * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "senha", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) throw new Error("Credenciais inválidas.");

        const isValid = await compare(password, user.password);
        if (!isValid) throw new Error("Senha incorreta.");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image || "",
        } as CustomUser;
      },
    }),
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
