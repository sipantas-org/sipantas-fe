<!-- src/components/ConfirmDeleteDialog.vue -->
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

withDefaults(
  defineProps<{
    title?: string;
    deleting?: boolean;
    errorMessage?: string;
  }>(),
  {
    title: "Hapus Data?",
    deleting: false,
    errorMessage: undefined,
  },
);

const emit = defineEmits<{
  (e: "confirm"): void;
}>();

const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (val) => {
        if (!deleting) open = val;
      }
    "
  >
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="gap-1.5">
        <DialogTitle class="text-base">
          {{ title }}
        </DialogTitle>
        <DialogDescription class="text-sm">
          <slot
            >Tindakan ini tidak dapat dibatalkan dan data akan dihapus secara
            permanen.</slot
          >
        </DialogDescription>
      </DialogHeader>

      <p v-if="errorMessage" role="alert" class="text-destructive text-sm">
        {{ errorMessage }}
      </p>

      <DialogFooter class="gap-2">
        <Button
          variant="outline"
          class="h-10 text-sm"
          :disabled="deleting"
          @click="open = false"
        >
          Batal
        </Button>
        <Button
          variant="destructive"
          class="h-10 text-sm"
          :disabled="deleting"
          @click="emit('confirm')"
        >
          <RiLoader4Line v-if="deleting" class="animate-spin" />
          {{ deleting ? "Menghapus..." : "Hapus" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
