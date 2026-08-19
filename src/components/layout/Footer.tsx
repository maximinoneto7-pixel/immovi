import Link from 'next/link'
import { Home, Phone, Mail, MapPin, Shield, Heart } from 'lucide-react'

export default function Footer() {
  const ano = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">

      {/* ─── Corpo principal ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Col 1 — Identidade + dados jurídicos */}
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-lg leading-tight">
                  Immo<span className="text-indigo-400">vi</span>
                </div>
                <div className="text-xs text-gray-500 leading-tight">Marketplace imobiliário</div>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Conectamos pessoas a imóveis com transparência, humanidade e segurança.
              Porque cada negociação tem uma história.
            </p>

            <p className="text-xs text-gray-500 mb-5">
              Uma empresa do grupo <span className="text-gray-400 font-medium">MNM Tecnologia</span>
            </p>

            {/* Dados jurídicos */}
            <div className="space-y-1.5 text-xs text-gray-500">
              <div>MNM Tecnologia LTDA</div>
              <div>CNPJ: 67.880.630/0001-79</div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-0.5" />
                <span>Ivolândia — GO, Brasil</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-5">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Plataforma Verificada e Segura</span>
            </div>
          </div>

          {/* Col 2 — Links */}
          <div>
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/imoveis" className="hover:text-indigo-400 transition-colors">
                  Buscar Imóveis
                </Link>
              </li>
              <li>
                <Link href="/imoveis/novo" className="hover:text-indigo-400 transition-colors">
                  Anunciar Imóvel
                </Link>
              </li>
              <li>
                <Link href="/calculadora" className="hover:text-indigo-400 transition-colors">
                  Calculadora de Custos
                </Link>
              </li>
              <li>
                <Link href="/avaliar" className="hover:text-indigo-400 transition-colors">
                  Avaliar Meu Imóvel
                </Link>
              </li>
              <li>
                <Link href="/planos" className="hover:text-indigo-400 transition-colors">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link href="/servicos" className="hover:text-indigo-400 transition-colors">
                  Serviços
                </Link>
              </li>
              <li>
                <Link href="/contratos/novo" className="hover:text-indigo-400 transition-colors">
                  Contratos Digitais
                </Link>
              </li>
              <li>
                <Link href="/guia-video" className="hover:text-indigo-400 transition-colors">
                  Guia de Vídeo
                </Link>
              </li>
              <li className="pt-2 border-t border-gray-800">
                <Link href="/termos" className="hover:text-indigo-400 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-indigo-400 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 — Contato */}
          <div>
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="mailto:contato@immovi.com.br"
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                    <Mail className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">E-mail</div>
                    <div className="text-gray-300 group-hover:text-indigo-400 transition-colors">
                      contato@immovi.com.br
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/556294263425"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-green-600 transition-colors">
                    <Phone className="w-4 h-4 text-green-400 group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">WhatsApp</div>
                    <div className="text-gray-300 group-hover:text-green-400 transition-colors">
                      +55 62 94263-1425
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Localização</div>
                    <div className="text-gray-300">
                      Ivolândia — GO, Brasil
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ─── Rodapé inferior ─────────────────────────────────── */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>
              © {ano} Immovi · Todos os direitos reservados
            </p>
            <div className="flex items-center gap-1.5">
              <span>Feito com</span>
              <Heart className="w-3 h-3 text-red-500 fill-current" />
              <span>em Ivolândia — GO</span>
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}
