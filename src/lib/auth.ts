import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Senha', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      })

      if (!user || !user.password) return null

      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        user.password
      )

      if (!passwordMatch) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }
    },
  }),
]

// Google OAuth — ativo se as variáveis estiverem configuradas
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as any
  )
}

// Apple OAuth — ativo se as variáveis estiverem configuradas
if (process.env.APPLE_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }) as any
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || 'BUYER'
      }
      // Ao fazer login com OAuth, criar/buscar usuário no banco
      if (account?.provider === 'google' || account?.provider === 'apple') {
        const existing = await prisma.user.findUnique({
          where: { email: token.email! },
        })
        if (existing) {
          token.id = existing.id
          token.role = existing.role
        } else if (token.email) {
          const newUser = await prisma.user.create({
            data: {
              name: token.name || 'Usuário',
              email: token.email,
              image: token.picture as string | undefined,
              role: 'BUYER',
            },
          })
          token.id = newUser.id
          token.role = newUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'BUYER'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
