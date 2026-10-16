<script setup lang="ts">
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AppFooter from './AppFooter.vue'
import AppNavbar from './AppNavbar.vue'
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppNavbar />
      <main class="flex-1 p-4 md:p-8">
        <RouterView />
      </main>
      <AppFooter />
    </SidebarInset>
  </SidebarProvider>
</template>
