<script setup lang="ts">
import { RiMoonLine, RiSunLine } from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import { isDark, toggleDark } from "@/lib/mode";
</script>

<template>
  <!-- Floating light/dark switch for pages outside the app layout. -->
  <Button
    type="button"
    variant="outline"
    size="icon"
    class="bg-background fixed bottom-4 left-4 z-50 size-10 rounded-full shadow-md sm:bottom-6 sm:left-6"
    :aria-label="isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'"
    :title="isDark ? 'Mode terang' : 'Mode gelap'"
    @click="toggleDark()"
  >
    <component :is="isDark ? RiSunLine : RiMoonLine" class="size-5" />
  </Button>
</template>
