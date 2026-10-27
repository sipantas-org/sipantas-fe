<script setup lang="ts">
import { RiAddLine, RiDeleteBinLine } from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import type {
  CreateSurveyPayload,
  SurveyFurnitureDetailPayload,
} from "@/services/survey/survey";

const props = defineProps<{
  form: CreateSurveyPayload;
  errors: Record<string, string>;
  isDetailMode: boolean;
}>();

const emit = defineEmits<{
  (e: "updateTotals"): void;
}>();

function addHousingDetail() {
  if (props.isDetailMode) return;
  props.form.housingDetails?.push({
    housingDamageAssessmentId: Date.now(),
    totalUnit: 1,
    score: 0,
  });
}

function removeHousingDetail(index: number) {
  if (props.isDetailMode) return;
  props.form.housingDetails?.splice(index, 1);
}

function addFurnitureDetail() {
  if (props.isDetailMode) return;
  props.form.furnitureDetails?.push({
    furnitureName: "",
    damageCategory: "Ringan",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    description: "",
  });
}

function removeFurnitureDetail(index: number) {
  if (props.isDetailMode) return;
  props.form.furnitureDetails?.splice(index, 1);
  emit("updateTotals");
}

function onFurniturePriceChange(item: SurveyFurnitureDetailPayload) {
  item.totalPrice =
    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  emit("updateTotals");
}
</script>

<template>
  <fieldset :disabled="isDetailMode" class="space-y-6">
    <!-- Housing Details -->
    <div class="rounded-xl border p-5 bg-card space-y-4">
      <div class="flex items-center justify-between border-b pb-2">
        <h2 class="text-base font-semibold">Kondisi Bangunan / Rumah</h2>
        <Button
          v-if="!isDetailMode"
          type="button"
          variant="outline"
          size="sm"
          @click="addHousingDetail"
        >
          <RiAddLine class="size-4 mr-1" /> Tambah Asesmen Bangunan
        </Button>
      </div>

      <div
        v-if="!form.housingDetails?.length"
        class="text-sm text-muted-foreground text-center py-6"
      >
        Belum ada data penilaian kerusakan fisik bangunan.
      </div>

      <div
        v-for="(item, idx) in form.housingDetails"
        :key="idx"
        class="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-lg relative items-end"
      >
        <div>
          <label class="text-xs font-medium text-foreground">Jumlah Unit</label>
          <input
            v-model.number="item.totalUnit"
            type="number"
            min="1"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-foreground"
            >Skor Kerusakan (0 - 100)</label
          >
          <input
            v-model.number="item.score"
            type="number"
            min="0"
            max="100"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div class="flex justify-end">
          <Button
            v-if="!isDetailMode"
            type="button"
            variant="ghost"
            size="icon"
            class="text-destructive"
            @click="removeHousingDetail(idx)"
          >
            <RiDeleteBinLine class="size-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Furniture Details -->
    <div class="rounded-xl border p-5 bg-card space-y-4">
      <div class="flex items-center justify-between border-b pb-2">
        <h2 class="text-base font-semibold">
          Kerusakan Perabotan & Isi Bangunan
        </h2>
        <Button
          v-if="!isDetailMode"
          type="button"
          variant="outline"
          size="sm"
          @click="addFurnitureDetail"
        >
          <RiAddLine class="size-4 mr-1" /> Tambah Perabotan
        </Button>
      </div>

      <div
        v-if="!form.furnitureDetails?.length"
        class="text-sm text-muted-foreground text-center py-6"
      >
        Belum ada data perabotan yang dimasukkan.
      </div>

      <div
        v-for="(f, idx) in form.furnitureDetails"
        :key="idx"
        class="grid grid-cols-1 md:grid-cols-6 gap-3 border p-3 rounded-lg relative items-end"
      >
        <div class="md:col-span-2">
          <label class="text-xs font-medium text-foreground"
            >Nama Perabotan *</label
          >
          <input
            v-model="f.furnitureName"
            type="text"
            placeholder="Contoh: Meja makan"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
          <p
            v-if="errors[`furnitureName_${idx}`]"
            class="text-xs text-destructive mt-1"
          >
            {{ errors[`furnitureName_${idx}`] }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">Kategori</label>
          <select
            v-model="f.damageCategory"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="Ringan">Ringan</option>
            <option value="Sedang">Sedang</option>
            <option value="Berat">Berat</option>
            <option value="TMK">TMK</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground">Jumlah</label>
          <input
            v-model.number="f.quantity"
            type="number"
            min="1"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            @input="onFurniturePriceChange(f)"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-foreground"
            >Harga Satuan (Rp)</label
          >
          <input
            v-model.number="f.unitPrice"
            type="number"
            min="0"
            class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            @input="onFurniturePriceChange(f)"
          />
        </div>
        <div class="flex items-center justify-between md:justify-end gap-2">
          <div class="text-right">
            <p class="text-xs text-muted-foreground">Total</p>
            <p class="text-sm font-semibold">
              Rp {{ (f.totalPrice || 0).toLocaleString("id-ID") }}
            </p>
          </div>
          <Button
            v-if="!isDetailMode"
            type="button"
            variant="ghost"
            size="icon"
            class="text-destructive shrink-0"
            @click="removeFurnitureDetail(idx)"
          >
            <RiDeleteBinLine class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </fieldset>
</template>
