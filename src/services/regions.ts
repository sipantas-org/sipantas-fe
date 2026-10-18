export interface Region {
  id: string
  name: string
}

// Stub: sample data. IDs use the BPS format the register API expects (province "31", city "31.71"). Replace with API calls.
const PROVINCES: Region[] = [
  { id: '31', name: 'DKI Jakarta' },
  { id: '32', name: 'Jawa Barat' },
  { id: '33', name: 'Jawa Tengah' },
  { id: '35', name: 'Jawa Timur' },
]

const CITIES: Record<string, Region[]> = {
  31: [
    { id: '31.71', name: 'Kota Jakarta Selatan' },
    { id: '31.72', name: 'Kota Jakarta Timur' },
    { id: '31.73', name: 'Kota Jakarta Pusat' },
    { id: '31.74', name: 'Kota Jakarta Barat' },
    { id: '31.75', name: 'Kota Jakarta Utara' },
  ],
  32: [
    { id: '32.71', name: 'Kota Bogor' },
    { id: '32.73', name: 'Kota Bandung' },
    { id: '32.76', name: 'Kota Depok' },
  ],
  33: [
    { id: '33.72', name: 'Kota Surakarta' },
    { id: '33.74', name: 'Kota Semarang' },
  ],
  35: [
    { id: '35.73', name: 'Kota Malang' },
    { id: '35.78', name: 'Kota Surabaya' },
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
