<script setup lang="ts">
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppFooter from "./AppFooter.vue";
import AppNavbar from "./AppNavbar.vue";
import AppSidebar from "./AppSidebar.vue";
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="min-w-0 overflow-x-hidden">
      <AppNavbar />

      <main
        class="min-w-0 flex-1 overflow-x-auto p-4 shadow-[inset_8px_8px_10px_-8px_rgb(0_0_0/0.13)] md:p-6"
      >
        <RouterView />
      </main>
      <AppFooter />
    </SidebarInset>
  </SidebarProvider>
</template>
