import { defineStore } from "pinia";
import { reactive } from "vue";
import { fetchDistrict, type DistrictItem } from "@/services/master/district";
import { fetchRegency, type RegencyItem } from "@/services/master/regency";

// Names of the regencies/districts shown in table rows, looked up by ID and cached.
export const useAreaNamesStore = defineStore("area-names", () => {
  const regencies = reactive<Record<string, RegencyItem>>({});
  const districts = reactive<Record<string, DistrictItem>>({});

  async function ensureRegencies(ids: string[]) {
    const missing = [...new Set(ids)].filter((id) => !regencies[id]);
    await Promise.allSettled(
      missing.map(async (id) => {
        regencies[id] = await fetchRegency(id);
      }),
    );
  }

  // Also looks up the regencies of those districts.
  async function ensureDistricts(ids: string[]) {
    const missing = [...new Set(ids)].filter((id) => !districts[id]);
    await Promise.allSettled(
      missing.map(async (id) => {
        districts[id] = await fetchDistrict(id);
      }),
    );
    await ensureRegencies(
      ids.map((id) => districts[id]?.regencyId).filter((id) => !!id),
    );
  }

  // A renamed or deleted item must be looked up again.
  function forgetRegency(id: string) {
    delete regencies[id];
  }

  function forgetDistrict(id: string) {
    delete districts[id];
  }

  return {
    regencies,
    districts,
    ensureRegencies,
    ensureDistricts,
    forgetRegency,
    forgetDistrict,
  };
});
