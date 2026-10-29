<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import ModeToggle from "@/components/ModeToggle.vue";

const route = useRoute();

// Pages outside the app layout, which has its own mode switch in the sidebar.
const FLOATING_MODE_ROUTES = ["landing", "complain-submit", "login", "register"];
const showModeToggle = computed(() =>
  FLOATING_MODE_ROUTES.includes(String(route.name ?? "")),
);
</script>

<template>
  <RouterView />
  <ModeToggle v-if="showModeToggle" />
  <Toaster position="top-right" rich-colors :expand="true" close-button />
</template>
