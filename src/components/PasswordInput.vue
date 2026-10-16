<script setup lang="ts">
import { RiEyeLine, RiEyeOffLine } from '@remixicon/vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

defineProps<{
  id: string
  autocomplete?: string
  invalid?: boolean
  disabled?: boolean
}>()

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <Input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      class="h-10 pr-10 text-sm md:text-sm"
      :aria-invalid="invalid"
      :disabled="disabled"
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="absolute top-1.5 right-1.5 size-7"
      :aria-label="visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
      :disabled="disabled"
      @click="visible = !visible"
    >
      <RiEyeOffLine v-if="visible" />
      <RiEyeLine v-else />
    </Button>
  </div>
</template>
