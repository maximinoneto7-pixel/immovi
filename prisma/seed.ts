import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 as PrismaAdapterSQLite } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaAdapterSQLite({ url: dbUrl })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Iniciando seed...')

  const password = await bcrypt.hash('senha123', 12)

  // Usuários
  const [maria, joao, ana, carlos] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'maria@exemplo.com' },
      update: {},
      create: {
        name: 'Maria Silva',
        email: 'maria@exemplo.com',
        password,
        phone: '(11) 99999-0001',
        role: 'SELLER',
        verified: true,
        bio: 'Moradora de São Paulo há 20 anos, apaixonada por imóveis com história.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'joao@exemplo.com' },
      update: {},
      create: {
        name: 'João Pereira',
        email: 'joao@exemplo.com',
        password,
        phone: '(11) 99999-0002',
        role: 'SELLER',
        verified: true,
        bio: 'Proprietário rural com 15 anos de experiência em fazendas.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ana@exemplo.com' },
      update: {},
      create: {
        name: 'Ana Costa',
        email: 'ana@exemplo.com',
        password,
        phone: '(21) 99999-0003',
        role: 'SELLER',
        verified: false,
        bio: 'Moradora do Rio de Janeiro buscando nova família para meu apartamento.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'carlos@exemplo.com' },
      update: {},
      create: {
        name: 'Carlos Mendes',
        email: 'carlos@exemplo.com',
        password,
        phone: '(31) 99999-0004',
        role: 'BUYER',
        verified: true,
      },
    }),
  ])

  const roberto = await prisma.user.upsert({
    where: { email: 'roberto@exemplo.com' },
    update: {},
    create: {
      name: 'Roberto Almeida',
      email: 'roberto@exemplo.com',
      password,
      phone: '(62) 99999-0005',
      role: 'SELLER',
      verified: true,
      bio: 'Corretor local em Ivolândia — GO, conheço cada rua da cidade e região.',
      creci: '32145-GO',
      creciState: 'GO',
    },
  })

  console.log('✅ Usuários criados')

  // Imóveis
  const properties = [
    {
      title: 'Casa espaçosa com jardim no Jardim América',
      description: 'Linda casa de 3 andares com jardim amplo, garagem para 2 carros, sala de estar e jantar integradas, cozinha americana moderna, 4 suítes com closet. Imóvel em excelente estado de conservação, reformado em 2022.',
      story: 'Minha família viveu aqui por 15 anos. O que mais vou sentir falta é o jardim que cuidamos com tanto carinho — tem uma jabuticabeira que dá frutos incríveis todo ano. Os vizinhos são maravilhosos, tem festa junina na rua todo São João. É uma rua tranquila, perfeita para criar filhos.',
      type: 'HOUSE',
      listingType: 'SALE',
      price: 1200000,
      area: 280,
      bedrooms: 4,
      bathrooms: 4,
      parkingSpaces: 2,
      furnished: false,
      acceptsPets: true,
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Jardim América',
      zipCode: '01443-001',
      featured: true,
      verified: true,
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      ownerId: maria.id,
      images: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      ],
      features: ['Piscina', 'Churrasqueira', 'Jardim', 'Portão automático', 'Cerca elétrica', 'Alarme'],
    },
    {
      title: 'Apartamento moderno com vista para o mar em Copacabana',
      description: 'Apartamento reformado totalmente, com vista deslumbrante para o mar. Sala ampla, cozinha moderna, 2 quartos com suíte, varanda gourmet. Condomínio com piscina, academia e portaria 24h.',
      story: 'Acordei olhando para o mar todos os dias por 8 anos. A vista ao entardecer é de tirar o fôlego — o sol se pondo no oceano direto da sua janela. O bairro tem tudo a pé: mercado, farmácia, restaurantes incríveis na esquina.',
      type: 'APARTMENT',
      listingType: 'BOTH',
      price: 980000,
      rentPrice: 4500,
      area: 85,
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      furnished: true,
      acceptsPets: false,
      address: 'Av. Atlântica, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      neighborhood: 'Copacabana',
      zipCode: '22010-000',
      featured: true,
      verified: true,
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      ownerId: ana.id,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      ],
      features: ['Vista para o mar', 'Varanda', 'Piscina no condomínio', 'Academia', 'Portaria 24h', 'Mobiliado'],
    },
    {
      title: 'Fazenda produtiva de 500 hectares com sede completa',
      description: 'Excelente fazenda com 500 hectares, sendo 350 ha de pasto formado, 80 ha de área cultivável e 70 ha de reserva legal. Sede com 4 quartos, galpão, curral, açude e mangueiras. Energia elétrica, internet via satélite.',
      story: 'Três gerações da minha família trabalharam nesta terra. Meu avô comprou essa fazenda nos anos 60 e desde então fomos construindo tudo com muito trabalho e amor. A terra é boa, fértil, com água suficiente o ano todo. É uma fazenda que dá resultado, mas mais do que isso, é um lugar que tem alma.',
      type: 'FARM',
      listingType: 'SALE',
      price: 3500000,
      area: 5000000,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpaces: 10,
      furnished: false,
      acceptsPets: true,
      address: 'Estrada Vicinal km 15',
      city: 'Uberaba',
      state: 'MG',
      neighborhood: null,
      zipCode: '38001-000',
      featured: true,
      verified: true,
      ownerId: joao.id,
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
      ],
      features: ['350ha de pasto', '80ha cultiváveis', 'Açude', 'Galpão 500m²', 'Curral', 'Energia elétrica', 'Internet'],
    },
    {
      title: 'Terreno em condomínio fechado — 1.000m² em Alphaville',
      description: 'Terreno plano de 1.000m² em condomínio fechado de alto padrão. Infraestrutura completa: ruas asfaltadas, rede de água, esgoto e gás, fibra óptica. Próximo ao polo empresarial e shopping.',
      story: 'Comprei este terreno há 5 anos como investimento, mas decidi que não vou construir. É uma localização privilegiada — quando entrei no condomínio pela primeira vez achei que estava em outro país, tanta é a qualidade da infraestrutura.',
      type: 'LAND',
      listingType: 'SALE',
      price: 650000,
      area: 1000,
      bedrooms: null,
      bathrooms: null,
      parkingSpaces: null,
      furnished: false,
      acceptsPets: false,
      address: 'Condomínio Alphaville, lote 45',
      city: 'Barueri',
      state: 'SP',
      neighborhood: 'Alphaville',
      zipCode: '06454-000',
      featured: false,
      verified: true,
      ownerId: maria.id,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      ],
      features: ['Condomínio fechado', 'Terreno plano', 'Infraestrutura completa', 'Segurança 24h', 'Área verde'],
    },
    {
      title: 'Casa térrea com quintal enorme para família grande',
      description: 'Casa térrea com 200m² de área construída e 500m² de terreno. 3 quartos, 2 banheiros, sala ampla, cozinha espaçosa, área de serviço coberta e quintal com churrasqueira e pomar.',
      story: 'Esta casa foi construída pelo meu pai para nossa família. Criamos 4 filhos aqui, as crianças brincavam no quintal enquanto a gente churrascava. Temos árvores frutíferas de tudo: manga, laranja, limão, goiaba. Um pedaço de paraíso dentro da cidade.',
      type: 'HOUSE',
      listingType: 'SALE',
      price: 450000,
      area: 200,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      furnished: false,
      acceptsPets: true,
      address: 'Rua Silveira Martins, 789',
      city: 'Campinas',
      state: 'SP',
      neighborhood: 'Cambuí',
      zipCode: '13025-000',
      featured: false,
      verified: false,
      ownerId: ana.id,
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      ],
      features: ['Quintal 500m²', 'Churrasqueira', 'Pomar', 'Garagem 2 carros', 'Área de serviço coberta'],
    },
    {
      title: 'Kitnet reformada próximo à USP — ideal para estudantes',
      description: 'Kitnet de 32m² totalmente reformada, com móveis planejados, ar condicionado, internet fibra. Prédio com câmeras, porteiro eletrônico. A 10 minutos a pé da USP e ESALQ.',
      story: null,
      type: 'APARTMENT',
      listingType: 'RENT',
      price: 1200,
      rentPrice: 1200,
      area: 32,
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 0,
      furnished: true,
      acceptsPets: false,
      address: 'Rua Nove de Julho, 321',
      city: 'Piracicaba',
      state: 'SP',
      neighborhood: 'Centro',
      zipCode: '13400-000',
      featured: false,
      verified: false,
      ownerId: joao.id,
      images: [
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      ],
      features: ['Mobiliada', 'Ar condicionado', 'Internet fibra', 'Porteiro eletrônico', 'Câmeras de segurança'],
    },
    {
      title: 'Casa de esquina no Centro de Ivolândia',
      description: 'Casa de esquina com 3 quartos, sala ampla, cozinha com armários planejados e quintal com espaço para horta. Rua calçada, próxima à praça central e ao comércio.',
      story: 'Comprei essa casa em 2010 para ficar perto da minha mãe. É bem tranquila, dá pra ir a pé em tudo que precisa na cidade. Tem uma mangueira enorme no quintal que dá sombra boa na hora do almoço.',
      type: 'HOUSE',
      listingType: 'SALE',
      price: 220000,
      area: 140,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      furnished: false,
      acceptsPets: true,
      address: 'Rua Goiás, 88',
      city: 'Ivolândia',
      state: 'GO',
      neighborhood: 'Centro',
      zipCode: '76410-000',
      featured: true,
      verified: true,
      ownerId: roberto.id,
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      ],
      features: ['Quintal', 'Rua calçada', 'Próximo ao comércio', 'Portão automático'],
    },
    {
      title: 'Casa nova em bairro residencial de Ivolândia',
      description: 'Casa recém-construída, 2 quartos sendo 1 suíte, cozinha americana, área de serviço separada e garagem coberta. Acabamento em porcelanato, pronta para morar.',
      story: null,
      type: 'HOUSE',
      listingType: 'SALE',
      price: 265000,
      area: 95,
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      furnished: false,
      acceptsPets: true,
      address: 'Rua das Palmeiras, 210',
      city: 'Ivolândia',
      state: 'GO',
      neighborhood: 'Setor Novo Horizonte',
      zipCode: '76410-000',
      featured: false,
      verified: true,
      ownerId: roberto.id,
      images: [
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
      ],
      features: ['Casa nova', 'Suíte', 'Porcelanato', 'Garagem coberta'],
    },
    {
      title: 'Casa simples com terreno grande em Ivolândia',
      description: 'Casa simples de 2 quartos em terreno de 600m², ideal para quem quer espaço para ampliar ou criar pequenos animais. Água de poço artesiano e energia já instalados.',
      story: 'Meu pai construiu essa casinha aos poucos, sempre pensando em deixar terreno pra gente crescer. Nunca faltou espaço pra criar galinha e ter uma horta boa.',
      type: 'HOUSE',
      listingType: 'SALE',
      price: 180000,
      area: 70,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpaces: 2,
      furnished: false,
      acceptsPets: true,
      address: 'Rua do Rosário, 340',
      city: 'Ivolândia',
      state: 'GO',
      neighborhood: null,
      zipCode: '76410-000',
      featured: false,
      verified: false,
      ownerId: roberto.id,
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      ],
      features: ['Terreno 600m²', 'Poço artesiano', 'Espaço para horta'],
    },
    {
      title: 'Kitnet para alugar próximo ao centro de Ivolândia',
      description: 'Kitnet de 28m² com cozinha integrada, banheiro e área para máquina de lavar. A 5 minutos a pé do centro da cidade. Ideal para quem trabalha na região.',
      story: null,
      type: 'APARTMENT',
      listingType: 'RENT',
      price: 700,
      rentPrice: 700,
      area: 28,
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 1,
      furnished: true,
      acceptsPets: false,
      address: 'Avenida Brasil, 55',
      city: 'Ivolândia',
      state: 'GO',
      neighborhood: 'Centro',
      zipCode: '76410-000',
      featured: false,
      verified: true,
      ownerId: roberto.id,
      images: [
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      ],
      features: ['Mobiliada', 'Cozinha integrada', 'Próximo ao centro'],
    },
  ]

  for (const p of properties) {
    const { images, features, ...data } = p
    await prisma.property.create({
      data: {
        ...data,
        neighborhood: data.neighborhood ?? undefined,
        zipCode: data.zipCode ?? undefined,
        bedrooms: data.bedrooms ?? undefined,
        bathrooms: data.bathrooms ?? undefined,
        parkingSpaces: data.parkingSpaces ?? undefined,
        rentPrice: data.rentPrice ?? undefined,
        story: data.story ?? undefined,
        images: {
          create: images.map((url, i) => ({ url, order: i, isCover: i === 0 })),
        },
        features: {
          create: features.map((name) => ({ name })),
        },
      },
    })
  }

  console.log('✅ Imóveis criados')
  console.log('')
  console.log('📋 Contas para teste:')
  console.log('   maria@exemplo.com  | senha123 (vendedora verificada)')
  console.log('   joao@exemplo.com   | senha123 (vendedor verificado)')
  console.log('   ana@exemplo.com    | senha123 (vendedora)')
  console.log('   carlos@exemplo.com | senha123 (comprador)')
  console.log('   roberto@exemplo.com| senha123 (corretor em Ivolândia-GO)')
  console.log('')
  console.log('🚀 Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
