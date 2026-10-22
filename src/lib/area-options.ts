import type { ComboLoader, ComboResolver } from "@/lib/combobox";
import { fetchDistrict, fetchDistrictPage } from "@/services/master/district";
import { fetchProvince, fetchProvincePage } from "@/services/master/province";
import { fetchRegency, fetchRegencyPage } from "@/services/master/regency";

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
