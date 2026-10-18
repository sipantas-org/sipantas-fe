<script setup lang="ts">
import { RiArrowDownSLine, RiLogoutBoxRLine, RiUserLine } from '@remixicon/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ROLE_LABEL } from '@/lib/navigation'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''))
const roleLabel = computed(() => (auth.role ? ROLE_LABEL[auth.role] : ''))

async function onLogout() {
  const role = auth.role ?? 'admin'
  auth.logout()
  await router.push({ name: 'login', params: { role } })
}
</script>

<template>
  <header class="bg-background/95 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="mr-2 data-vertical:h-4 data-vertical:self-auto" />

    <Breadcrumb class="min-w-0">
      <BreadcrumbList class="text-sm">
        <BreadcrumbItem class="hidden sm:inline-flex">
          SIPANTAS
        </BreadcrumbItem>
        <BreadcrumbSeparator class="hidden sm:block" />
        <BreadcrumbItem class="min-w-0">
          <BreadcrumbPage class="truncate">
            {{ title }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div class="ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="h-10 gap-2 px-2 text-sm" aria-label="Menu akun">
            <Avatar class="size-8">
              <AvatarFallback class="bg-primary text-primary-foreground text-sm">
                {{ roleLabel.slice(0, 1) }}
              </AvatarFallback>
            </Avatar>
            <span class="hidden sm:inline">{{ roleLabel }}</span>
            <RiArrowDownSLine class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel class="text-sm">
            Masuk sebagai {{ roleLabel }}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="h-9 text-sm" @select="router.push('/profile')">
            <RiUserLine />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem class="h-9 text-sm" @select="onLogout">
            <RiLogoutBoxRLine />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
