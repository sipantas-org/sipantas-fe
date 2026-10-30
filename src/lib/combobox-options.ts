import type { ComboLoader, ComboResolver } from "@/lib/combobox";
import { fetchDisaster, fetchDisasters } from "@/services/master/disaster";
import { fetchDistrict, fetchDistrictPage } from "@/services/master/district";
import { fetchProvince, fetchProvincePage } from "@/services/master/province";
import { fetchRegency, fetchRegencyPage } from "@/services/master/regency";
import { fetchVillage, fetchVillagePage } from "@/services/master/village";

export const disasterLoader: ComboLoader = async ({ search, page, limit }) => {
  try {
    const res = await fetchDisasters({
      status: "Active",
      disasterName: search?.trim() || undefined,
      page: page ?? 1,
      limit: limit ?? 20,
    });
    const items =
      (res as any)?.items ??
      (Array.isArray((res as any)?.data) ? (res as any).data : []);
    const total =
      (res as any)?.total ?? (res as any)?.pagination?.total ?? items.length;
    return {
      items: items.map((item: any) => ({
        value: String(item.disasterId),
        label: `${item.disasterName} (${item.disasterCode})`,
      })),
      total,
    };
  } catch (error) {
    console.error("Gagal memuat opsi bencana:", error);
    return {
      items: [],
      total: 0,
    };
  }
};

export const disasterResolver: ComboResolver = async (val) => {
  if (!val || Number(val) === 0) return undefined;
  const id = Number(val);
  try {
    const res = await fetchDisaster(id);
    const data = (res as any)?.data ?? res;
    if (data) {
      return {
        value: String(data.disasterId ?? val),
        label: `${data.disasterName} (${data.disasterCode})`,
      };
    }
  } catch (error) {
    console.error("Gagal memuat label bencana:", error);
  }
  return undefined;
};

// Combobox loaders for the area dropdowns. The server pages and searches by name.

export const provinceLoader: ComboLoader = async ({ search, page, limit }) => {
  const result = await fetchProvincePage({
    search: search || undefined,
    page,
    limit,
  });
  return {
    items: result.items.map((p) => ({ value: p.id, label: p.name })),
    total: result.total,
  };
};

export const provinceResolver: ComboResolver = async (id) => {
  const province = await fetchProvince(id);
  return { value: province.id, label: province.name };
};

// An empty provinceId lists every regency.
export function regencyLoader(provinceId?: string): ComboLoader {
  return async ({ search, page, limit }) => {
    const result = await fetchRegencyPage({
      provinceId: provinceId || undefined,
      search: search || undefined,
      page,
      limit,
    });
    return {
      items: result.items.map((r) => ({ value: r.id, label: r.name })),
      total: result.total,
    };
  };
}

export const regencyResolver: ComboResolver = async (id) => {
  const regency = await fetchRegency(id);
  return { value: regency.id, label: regency.name };
};

// An empty regencyId lists every district.
export function districtLoader(regencyId?: string): ComboLoader {
  return async ({ search, page, limit }) => {
    const result = await fetchDistrictPage({
      regencyId: regencyId || undefined,
      search: search || undefined,
      page,
      limit,
    });
    return {
      items: result.items.map((d) => ({ value: d.id, label: d.name })),
      total: result.total,
    };
  };
}

export const districtResolver: ComboResolver = async (id) => {
  const district = await fetchDistrict(id);
  return { value: district.id, label: district.name };
};

// An empty districtId lists every village.
export function villageLoader(districtId?: string): ComboLoader {
  return async ({ search, page, limit }) => {
    const result = await fetchVillagePage({
      districtId: districtId || undefined,
      search: search || undefined,
      page,
      limit,
    });
    return {
      items: result.items.map((v) => ({ value: v.id, label: v.name })),
      total: result.total,
    };
  };
}

export const villageResolver: ComboResolver = async (id) => {
  const village = await fetchVillage(id);
  return { value: village.id, label: village.name };
};
