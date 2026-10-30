<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import DashboardAdmin from "./DashboardAdmin.vue";
import DashboardSurveyor from "./DashboardSurveyor.vue";

const auth = useAuthStore();
const isAdmin = computed(() => auth.role === "admin");
const isSurveyor = computed(() => auth.role === "surveyor");
</script>

<template>
  <DashboardAdmin v-if="isAdmin" />
  <DashboardSurveyor v-else-if="isSurveyor" />

  <div v-else class="rounded-lg border border-dashed p-8 text-center">
    <p class="text-muted-foreground text-sm">Memuat informasi dashboard...</p>
  </div>
</template>
