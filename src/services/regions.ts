export interface Region {
  id: string
  name: string
}

// Stub: sample data, IDs may not match the database. Replace with API calls.
const PROVINCES: Region[] = [
  { id: '31', name: 'DKI Jakarta' },
  { id: '32', name: 'Jawa Barat' },
  { id: '33', name: 'Jawa Tengah' },
  { id: '35', name: 'Jawa Timur' },
]

const CITIES: Record<string, Region[]> = {
  31: [
    { id: '3171', name: 'Kota Jakarta Selatan' },
    { id: '3172', name: 'Kota Jakarta Timur' },
    { id: '3173', name: 'Kota Jakarta Pusat' },
    { id: '3174', name: 'Kota Jakarta Barat' },
    { id: '3175', name: 'Kota Jakarta Utara' },
  ],
  32: [
    { id: '3271', name: 'Kota Bogor' },
    { id: '3273', name: 'Kota Bandung' },
    { id: '3276', name: 'Kota Depok' },
  ],
  33: [
    { id: '3372', name: 'Kota Surakarta' },
    { id: '3374', name: 'Kota Semarang' },
  ],
  35: [
    { id: '3573', name: 'Kota Malang' },
    { id: '3578', name: 'Kota Surabaya' },
  ],
}

const LATENCY_MS = 300

function delay() {
  return new Promise(resolve => setTimeout(resolve, LATENCY_MS))
}

export async function fetchProvinces(): Promise<Region[]> {
  await delay()
  return PROVINCES
}

export async function fetchCities(provinceId: string): Promise<Region[]> {
  await delay()
  return CITIES[provinceId] ?? []
}
