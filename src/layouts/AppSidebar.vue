<script setup lang="ts">
import { RiArrowRightSLine, RiMapPinUserLine, RiMoonLine, RiShieldUserLine, RiSunLine } from '@remixicon/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { isDark, toggleDark } from '@/lib/mode'
import { ROLE_LABEL, navFor } from '@/lib/navigation'
import { useAuthStore } from '@/stores/auth'
import type { NavItem } from '@/lib/navigation'

const route = useRoute()
const auth = useAuthStore()
const { isMobile, setOpenMobile, state, setOpen } = useSidebar()

const items = computed(() => navFor(auth.role, auth.isMonitoring))
const roleIcon = computed(() => (auth.role === 'surveyor' ? RiMapPinUserLine : RiShieldUserLine))

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function isGroupActive(item: NavItem) {
  return !!item.children?.some(child => isActive(child.to))
}

function onNavigate() {
  if (isMobile.value)
    setOpenMobile(false)
}

// A collapsed (icon-only) sidebar has no room for sub-items, so expand it first.
function onGroupClick() {
  if (!isMobile.value && state.value === 'collapsed')
    setOpen(true)
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="h-16 justify-center border-b px-2 py-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink to="/dashboard" @click="onNavigate">
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
          <SidebarMenu>
            <template v-for="item in items" :key="item.label">
              <Collapsible
                v-if="item.children"
                as-child
                :default-open="isGroupActive(item)"
                class="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger as-child>
                    <SidebarMenuButton :tooltip="item.label" :is-active="isGroupActive(item)" @click="onGroupClick">
                      <component :is="item.icon" />
                      <span>{{ item.label }}</span>
                      <RiArrowRightSLine class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem
                        v-for="(child, index) in item.children"
                        :key="child.to"
                        :class="index > 0 && 'border-sidebar-border -mx-2.5 border-t px-2.5 pt-1'"
                      >
                        <SidebarMenuSubButton as-child :is-active="isActive(child.to)">
                          <RouterLink :to="child.to" @click="onNavigate">
                            <span>{{ child.label }}</span>
                          </RouterLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem v-else-if="item.to">
                <SidebarMenuButton as-child :is-active="isActive(item.to)" :tooltip="item.label">
                  <RouterLink :to="item.to" @click="onNavigate">
                    <component :is="item.icon" />
                    <span>{{ item.label }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </template>
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
