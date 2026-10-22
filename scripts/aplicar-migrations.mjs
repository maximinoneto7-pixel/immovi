// Aplica as migrations pendentes antes de construir o site.
//
// Sem este passo, subir código que depende de uma tabela nova deixa a produção
// com o código novo e o banco velho — foi o que aconteceu com a tabela Recado.
// Rodar aqui garante que banco e código sobem juntos: se a migration falhar, o
// deploy falha e a versão antiga continua no ar, que é o resultado desejado.
//
// Só age em PostgreSQL. Em sqlite (desenvolvimento) não faz nada, porque lá o
// histórico de migrations é do Postgres e o banco local vive de `prisma db push`.
import { execFileSync } from 'child_process'

const provider = process.env.DATABASE_PROVIDER || 'sqlite'

if (provider !== 'postgresql') {
  console.log(`[migrations] provider "${provider}": nada a aplicar.`)
  process.exit(0)
}

/**
 * Migration precisa da conexão direta.
 *
 * O Neon oferece duas: a "pooled", que passa por um intermediário e é a certa
 * para o site atender visitante, e a direta. O intermediário não deixa o Prisma
 * tomar a trava que ele usa para aplicar migration, então aqui procuramos a
 * direta — pelas variáveis que a integração costuma criar ou, em último caso,
 * tirando o "-pooler" do endereço, que é como o Neon nomeia as duas.
 */
function conexaoParaMigrations() {
  const explicita =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED
  if (explicita) return { url: explicita, origem: 'variável de conexão direta' }

  const padrao = process.env.DATABASE_URL
  if (!padrao) {
    console.error('[migrations] DATABASE_URL não está definida — não há onde aplicar.')
    process.exit(1)
  }

  if (padrao.includes('-pooler.')) {
    return { url: padrao.replace('-pooler.', '.'), origem: 'DATABASE_URL sem o "-pooler"' }
  }
  return { url: padrao, origem: 'DATABASE_URL' }
}

const { url, origem } = conexaoParaMigrations()
console.log(`[migrations] aplicando com ${origem}...`)

try {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
    shell: process.platform === 'win32',
  })
  console.log('[migrations] banco em dia.')
} catch {
  console.error('[migrations] falhou. O deploy para aqui de propósito: subir o código sem a tabela deixaria a produção quebrada.')
  process.exit(1)
}
