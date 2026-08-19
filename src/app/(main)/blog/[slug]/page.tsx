import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { auth } from '@/lib/auth'
import { getPost, getPosts } from '@/lib/blog/posts'
import { Clock, Calendar, ArrowLeft, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return getPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Blog Immovi`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.image] },
  }
}

// Renderiza markdown básico como HTML
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline">$1</a>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-start gap-2 text-gray-700"><span class="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5"></span>$1</li>')
    .replace(/^- (.+)$/gm, '<li class="text-gray-700">$1</li>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ')
      return `<tr>${cells.map((c: string) => `<td class="border border-gray-200 px-3 py-2 text-sm">${c}</td>`).join('')}</tr>`
    })
    .replace(/^---$/gm, '<hr class="border-gray-200 my-6"/>')
    .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-4">')
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const post = getPost(slug)
  if (!post) notFound()

  const allPosts = getPosts().filter(p => p.slug !== slug).slice(0, 3)
  const html = renderMarkdown(post.content.trim())

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-3xl mx-auto">
              <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">{post.category}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-3 leading-tight">{post.title}</h1>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
            <Link href="/blog" className="flex items-center gap-1.5 hover:text-indigo-600">
              <ArrowLeft className="w-4 h-4" /> Voltar ao blog
            </Link>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {post.readTime} min de leitura
            </span>
          </div>

          {/* Conteúdo */}
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="text-gray-700 leading-relaxed mb-4">${html}</p>` }}
          />

          {/* CTA */}
          <div className="mt-10 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
            <h3 className="font-bold text-gray-900 mb-2">Pronto para dar o próximo passo?</h3>
            <p className="text-gray-500 text-sm mb-4">Busque imóveis verificados ou anuncie o seu gratuitamente.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/imoveis" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
                Buscar imóveis
              </Link>
              <Link href="/imoveis/novo" className="px-5 py-2.5 border border-indigo-300 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors">
                Anunciar imóvel
              </Link>
            </div>
          </div>

          {/* Mais artigos */}
          {allPosts.length > 0 && (
            <div className="mt-10">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Mais artigos
              </h3>
              <div className="space-y-3">
                {allPosts.map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`}
                    className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <img src={p.image} alt={p.title} className="w-16 h-14 rounded-lg object-cover flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">{p.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.category} · {p.readTime} min</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
