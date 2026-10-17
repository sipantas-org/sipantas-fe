<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''))
</script>

<template>
  <div class="flex flex-col gap-1">
    <h1 class="text-xl font-semibold">
      {{ title }}
    </h1>
    <p class="text-muted-foreground text-sm">
      Halaman ini belum dibuat.
    </p>
  </div>
</template>
