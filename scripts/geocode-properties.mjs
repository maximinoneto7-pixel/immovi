// Geocodifica imóveis que não têm coordenadas
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 as SQLite } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const adapter = new SQLite({ url: `file:${path.resolve(process.cwd(), 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function geocode(city, state, address = '') {
  await new Promise(r => setTimeout(r, 1100)) // Nominatim: 1 req/s
  const query = address
    ? `${address}, ${city}, ${state}, Brasil`
    : `${city}, ${state}, Brasil`
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}&countrycodes=br`,
    { headers: { 'User-Agent': 'ImovelNaMao/1.0', 'Accept-Language': 'pt-BR' } }
  )
  const data = await res.json()
  if (data?.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  return { lat: null, lng: null }
}

async function main() {
  const properties = await prisma.property.findMany({
    where: { OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, address: true, city: true, state: true },
  })

  console.log(`📍 Geocodificando ${properties.length} imóveis...`)

  for (const p of properties) {
    const { lat, lng } = await geocode(p.city, p.state, p.address)
    if (lat && lng) {
      await prisma.property.update({
        where: { id: p.id },
        data: { latitude: lat, longitude: lng },
      })
      console.log(`  ✅ ${p.city}/${p.state} → ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } else {
      console.log(`  ⚠️ ${p.city}/${p.state} — não encontrado`)
    }
  }

  console.log('\n✅ Geocodificação concluída!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
