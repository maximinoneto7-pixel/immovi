import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { registrar, origemDa } from '@/lib/registro'

// Trava de senha: protege contra robô testando senha atrás de senha
const MAX_TENTATIVAS = 5
function esperaDeBloqueio(tentativas: number) {
  const minutos = Math.min(30, 5 * 2 ** (tentativas - MAX_TENTATIVAS))
  return minutos * 60 * 1000
}

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Senha', type: 'password' },
    },
    async authorize(credentials, request) {
      if (!credentials?.email || !credentials?.password) return null
      const origem = origemDa(request as any)
      const email = credentials.email as string

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      })

      if (!user || !user.password) {
        registrar('LOGIN_FALHA', { email, ...origem, detail: 'conta não encontrada' })
        return null
      }
      // Conta encerrada pela própria pessoa não volta a entrar
      if (user.deletedAt) return null
      // Conta suspensa pela administração também não
      if (user.suspendedAt) {
        registrar('LOGIN_FALHA', { userId: user.id, email, ...origem, detail: 'conta suspensa' })
        return null
      }

      // Senha errada demais: a conta descansa alguns minutos antes de aceitar nova tentativa
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        registrar('LOGIN_FALHA', { userId: user.id, email, ...origem, detail: 'tentativa durante bloqueio' })
        return null
      }

      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        user.password
      )

      if (!passwordMatch) {
        const tentativas = user.failedLogins + 1
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLogins: tentativas,
            // A partir da 5ª, a espera dobra: 5, 10, 20… até 30 minutos
            lockedUntil: tentativas >= MAX_TENTATIVAS
              ? new Date(Date.now() + esperaDeBloqueio(tentativas))
              : null,
          },
        })
        registrar('LOGIN_FALHA', { userId: user.id, email, ...origem, detail: `senha errada (${tentativas})` })
        return null
      }

      registrar('LOGIN', { userId: user.id, email, ...origem })

      if (user.failedLogins > 0 || user.lockedUntil) {
        await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } })
      }

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

// Em produção, o domínio às vezes serve tanto immovi.com.br quanto
// www.immovi.com.br (redirecionamento entre os dois). Compartilhar os
// cookies entre os dois subdomínios evita que o fluxo de login quebre
// quando a requisição começa num host e termina no outro.
//
// csrfToken fica de fora: em HTTPS o NextAuth nomeia esse cookie com o
// prefixo `__Host-`, que por especificação do navegador proíbe qualquer
// atributo Domain — setar um aqui faz o navegador rejeitar o cookie
// (o que causa exatamente o erro MissingCSRF que estamos corrigindo).
const isProdDomain = (process.env.NEXTAUTH_URL || '').includes('immovi.com.br')
const cookieDomain = isProdDomain ? '.immovi.com.br' : undefined

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  ...(cookieDomain
    ? {
        cookies: {
          sessionToken: { options: { domain: cookieDomain } },
          callbackUrl: { options: { domain: cookieDomain } },
          pkceCodeVerifier: { options: { domain: cookieDomain } },
          state: { options: { domain: cookieDomain } },
        },
      }
    : {}),
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
          // Conta encerrada: não reabre pelo Google
          if (existing.deletedAt) return {}
          token.id = existing.id
          token.role = existing.role
          // O próprio Google/Apple confirma o endereço: a conta não precisa do link
          if (!existing.emailVerified) {
            await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: new Date() } })
          }
        } else if (token.email) {
          const newUser = await prisma.user.create({
            data: {
              name: token.name || 'Usuário',
              email: token.email,
              image: token.picture as string | undefined,
              role: 'BUYER',
              emailVerified: new Date(),
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
