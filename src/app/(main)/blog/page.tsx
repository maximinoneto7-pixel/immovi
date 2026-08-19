import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { auth } from '@/lib/auth'
import { getPosts } from '@/lib/blog/posts'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Blog — Dicas de Imóveis | Immovi',
  description: 'Aprenda como comprar, vender e alugar imóveis com segurança. Guias, checklists e dicas do mercado imobiliário.',
}

export default async function BlogPage() {
  const session = await auth()
  const posts = getPosts()

  const CATEGORY_COLOR: Record<string, string> = {
    'Vendedores': 'bg-green-100 text-green-700',
    'Compradores': 'bg-indigo-100 text-indigo-700',
    'Locação': 'bg-violet-100 text-violet-700',
    'Investimento': 'bg-amber-100 text-amber-700',
  }

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-8 h-8 text-indigo-300" />
              <h1 className="text-3xl font-bold">Blog Immovi</h1>
            </div>
            <p className="text-gray-300 text-lg">
              Guias práticos, checklists e dicas para comprar, vender e alugar com segurança.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-video overflow-hidden">
                  <img src={post.image} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${CATEGORY_COLOR[post.category] || 'bg-gray-100 text-gray-600'}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime} min
                    </span>
                  </div>
                  <h2 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                    Ler artigo <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
