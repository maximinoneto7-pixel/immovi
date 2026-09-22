import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EditProfileForm from '@/components/perfil/EditProfileForm'
import ChangePasswordForm from '@/components/perfil/ChangePasswordForm'
import { ArrowLeft } from 'lucide-react'

export default async function EditarPerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/perfil/editar')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, image: true, phone: true, bio: true, cpf: true,
      city: true, state: true, role: true, password: true,
      creci: true, creciState: true, agencyName: true, agencyPhone: true, showActivity: true,
    },
  })

  if (!user) redirect('/')

  const { password, ...userWithoutPassword } = user

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Editar perfil</h1>
              <p className="text-sm text-gray-500">Mantenha seus dados atualizados</p>
            </div>
          </div>

          <EditProfileForm user={userWithoutPassword} />
          <ChangePasswordForm hasPassword={!!password} />
        </div>
      </main>
      <Footer />
    </>
  )
}
