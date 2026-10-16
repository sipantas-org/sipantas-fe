<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="text-muted-foreground flex flex-col items-center justify-between gap-1 h-16 border-t px-4 text-sm sm:flex-row">
    <span>&copy; {{ year }} SIPANTAS. Hak cipta dilindungi.</span>
    <span>Versi 0.0.0</span>
  </footer>
</template>
