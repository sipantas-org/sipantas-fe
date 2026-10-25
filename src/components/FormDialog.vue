<!-- src/components/FormDialog.vue -->
<script setup lang="ts">
import { RiLoader4Line } from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    submitting?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    maxWidthClass?: string;
  }>(),
  {
    description: "",
    submitting: false,
    submitLabel: "Simpan",
    cancelLabel: "Batal",
    maxWidthClass: "sm:max-w-lg",
  },
);

const emit = defineEmits<{
  (e: "submit"): void;
}>();

const open = defineModel<boolean>("open", { default: false });

function onOpenChange(val: boolean) {
  if (!props.submitting) {
    open.value = val;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      :class="['flex max-h-[90svh] flex-col gap-0 p-0', maxWidthClass]"
    >
      <DialogHeader class="border-b px-6 py-5">
        <DialogTitle class="text-base font-semibold">
          {{ title }}
        </DialogTitle>
        <DialogDescription v-if="description" class="text-sm">
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="flex min-h-0 flex-1 flex-col"
        novalidate
        @submit.prevent="emit('submit')"
      >
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <slot />
        </div>

        <DialogFooter
          class="border-t bg-muted/10 px-6 py-4 gap-2 sm:justify-end"
        >
          <Button
            type="button"
            variant="outline"
            class="h-10 text-sm"
            :disabled="submitting"
            @click="open = false"
          >
            {{ cancelLabel }}
          </Button>
          <Button type="submit" class="h-10 text-sm" :disabled="submitting">
            <RiLoader4Line v-if="submitting" class="size-4 animate-spin" />
            {{ submitting ? `${submitLabel}...` : submitLabel }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
