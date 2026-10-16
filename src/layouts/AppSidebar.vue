<script setup lang="ts">
import { RiMapPinUserLine, RiMoonLine, RiShieldUserLine, RiSunLine } from '@remixicon/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { NAV_ITEMS, ROLE_LABEL } from '@/lib/navigation'
import { isDark, toggleDark } from '@/lib/mode'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const { isMobile, setOpenMobile } = useSidebar()

const items = computed(() => NAV_ITEMS.filter(item => auth.role && item.roles.includes(auth.role)))
const roleIcon = computed(() => (auth.role === 'surveyor' ? RiMapPinUserLine : RiShieldUserLine))

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function onNavigate() {
  if (isMobile.value)
    setOpenMobile(false)
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="h-16 justify-center border-b px-2 py-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink to="/app/dashboard" @click="onNavigate">
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                <component :is="roleIcon" class="size-5" />
              </div>
              <div class="grid flex-1 text-left leading-tight">
                <span class="truncate text-base font-semibold">SIPANTAS</span>
                <span class="text-muted-foreground truncate text-sm">{{ auth.role ? ROLE_LABEL[auth.role] : '' }}</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu class="mt-4">
            <SidebarMenuItem v-for="item in items" :key="item.to">
              <SidebarMenuButton as-child :is-active="isActive(item.to)" :tooltip="item.label">
                <RouterLink :to="item.to" @click="onNavigate">
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="h-16 justify-center border-t px-2 py-0">
      <div class="flex items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <component :is="isDark ? RiMoonLine : RiSunLine" class="size-5 shrink-0 group-data-[collapsible=icon]:hidden" />
        <label for="mode-toggle" class="flex-1 truncate text-sm group-data-[collapsible=icon]:hidden">
          {{ isDark ? 'Mode Gelap' : 'Mode Terang' }}
        </label>
        <Switch id="mode-toggle" :model-value="isDark" aria-label="Mode gelap" @update:model-value="toggleDark" />
      </div>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
