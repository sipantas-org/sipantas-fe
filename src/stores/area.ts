import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchCities, fetchProvinces, type Region } from "@/services/regions";

export const useAreaStore = defineStore("area", () => {
  const provinces = ref<Region[]>([]);
  const cities = ref<Region[]>([]);
  const loadingProvinces = ref(false);
  const loadingCities = ref(false);

  async function loadProvinces() {
    if (provinces.value.length > 0) return;
    loadingProvinces.value = true;
    try {
      const res = await fetchProvinces();
      provinces.value = Array.isArray(res) ? res : ((res as any)?.data ?? []);
    } catch {
      provinces.value = [];
    } finally {
      loadingProvinces.value = false;
    }
  }

  async function loadCities(provinceId: string) {
    if (!provinceId) {
      cities.value = [];
      return;
    }
    loadingCities.value = true;
    try {
      const res = await fetchCities(provinceId);
      cities.value = Array.isArray(res) ? res : ((res as any)?.data ?? []);
    } catch {
      cities.value = [];
    } finally {
      loadingCities.value = false;
    }
  }

  function clearCities() {
    cities.value = [];
  }

  return {
    provinces,
    cities,
    loadingProvinces,
    loadingCities,
    loadProvinces,
    loadCities,
    clearCities,
  };
});
