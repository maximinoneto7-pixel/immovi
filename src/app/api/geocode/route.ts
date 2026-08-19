// Geocoding via Nominatim (OpenStreetMap) — gratuito, sem API key
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')
  const state = searchParams.get('state')

  const query = address
    ? `${address}, ${city}, ${state}, Brasil`
    : `${city}, ${state}, Brasil`

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}&countrycodes=br`,
      {
        headers: {
          'User-Agent': 'Immovi/1.0 (contato@immovi.com.br)',
          'Accept-Language': 'pt-BR',
        },
      }
    )

    if (!res.ok) throw new Error('Nominatim error')

    const data = await res.json()

    if (!data.length) {
      return Response.json({ lat: null, lng: null })
    }

    return Response.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    })
  } catch {
    return Response.json({ lat: null, lng: null })
  }
}
