<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from 'cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

defineProps<{
  icon: Component
  title: string
  wide?: boolean
}>()
</script>

<template>
  <main class="bg-muted flex min-h-svh items-center justify-center p-4">
    <div :class="cn('flex w-full flex-col', wide ? 'max-w-2xl gap-4' : 'max-w-md gap-6')">
      <div class="flex flex-col items-center gap-3">
        <div class="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl">
          <component :is="icon" class="size-7" />
        </div>
        <span class="text-base font-semibold tracking-wide">SIPANTAS</span>
      </div>

      <Card :class="cn('text-sm', wide ? 'gap-4 py-6' : 'gap-6 py-8')">
        <CardHeader class="gap-2 px-8 text-center">
          <CardTitle class="text-xl">
            {{ title }}
          </CardTitle>
        </CardHeader>

        <CardContent class="px-8">
          <slot />
        </CardContent>
      </Card>

      <div class="text-muted-foreground flex flex-col items-center gap-2 text-sm">
        <slot name="footer" />
      </div>
    </div>
  </main>
</template>
