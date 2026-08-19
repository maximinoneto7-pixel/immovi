// Busca todos os municípios do IBGE e salva em public/cidades-brasil.json
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('Buscando municípios do IBGE...')

const res = await fetch(
  'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
)

if (!res.ok) throw new Error(`Erro IBGE: ${res.status}`)

const data = await res.json()

const cidades = data
  .filter((m) => m.microrregiao?.mesorregiao?.UF?.sigla)
  .map((m) => ({
    city: m.nome,
    state: m.microrregiao.mesorregiao.UF.sigla,
  }))
  .sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city))

const outPath = join(__dirname, '..', 'public', 'cidades-brasil.json')
writeFileSync(outPath, JSON.stringify(cidades), 'utf-8')

console.log(`✅ ${cidades.length} municípios salvos em public/cidades-brasil.json`)
