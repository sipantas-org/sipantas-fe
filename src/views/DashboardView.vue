<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_LABEL } from '@/lib/navigation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const roleLabel = computed(() => (auth.role ? ROLE_LABEL[auth.role] : ''))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-xl font-semibold">
        Selamat datang, {{ roleLabel }}
      </h1>
      <p class="text-muted-foreground text-sm">
        Ringkasan aplikasi akan tampil di sini.
      </p>
    </div>

    <Card class="text-sm">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent class="text-muted-foreground">
        Konten dashboard belum dibuat.
      </CardContent>
    </Card>
  </div>
</template>
