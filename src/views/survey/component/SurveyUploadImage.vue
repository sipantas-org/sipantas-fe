<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiImageAddLine,
  RiLoader4Line,
  RiUploadCloud2Line,
} from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import { useUploadStore } from "@/stores/uploads";

export interface UploadedImageItem {
  id: string;
  category: string;
  filePath: string;
  fileName: string;
  previewUrl?: string;
}

export interface DocumentationApiPayload {
  category: string;
  filePath: string;
  fileName: string;
}

const props = withDefaults(
  defineProps<{
    folderPath?: string;
    isDetailMode?: boolean;
    modelValue?: DocumentationApiPayload[];
  }>(),
  {
    isDetailMode: false,
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: DocumentationApiPayload[]): void;
}>();

const uploadStore = useUploadStore();

const CATEGORY_OPTIONS = [
  { value: "", text: "Pilih Kategori" },
  {
    value: "Dokumentasi Kerusakan Pondasi",
    text: "Dokumentasi Kerusakan Pondasi",
  },
  {
    value: "Dokumentasi Kerusakan Kolom dan Balok",
    text: "Dokumentasi Kerusakan Kolom dan Balok",
  },
  {
    value: "Dokumentasi Kerusakan Rangka dan Kuda-Kuda Atap",
    text: "Dokumentasi Kerusakan Rangka dan Kuda-Kuda Atap",
  },
  {
    value: "Dokumentasi Kerusakan Material Penutup Atap",
    text: "Dokumentasi Kerusakan Material Penutup Atap",
  },
  {
    value: "Dokumentasi Kerusakan Dinding dan Partisi",
    text: "Dokumentasi Kerusakan Dinding dan Partisi",
  },
  {
    value: "Dokumentasi Kerusakan Lantai",
    text: "Dokumentasi Kerusakan Lantai",
  },
  {
    value: "Dokumentasi Kondisi Bangunan Keseluruhan",
    text: "Dokumentasi Kondisi Bangunan Keseluruhan",
  },
  { value: "Lainnya", text: "Lainnya" },
] as const;

// Local state
const selectedCategory = ref<string>(CATEGORY_OPTIONS[0].value);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const imageList = ref<UploadedImageItem[]>([]);

// Modal preview state
const previewModalOpen = ref(false);
const activePreviewItem = ref<UploadedImageItem | null>(null);

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Sinkronisasi dari modelValue jika data awal sudah ada (mode edit/detail)
watch(
  () => props.modelValue,
  (val) => {
    if (val && val.length > 0 && imageList.value.length === 0) {
      imageList.value = val.map((item) => ({
        id: `${item.category}-${item.fileName}-${Math.random()}`,
        category: item.category,
        filePath: item.filePath,
        fileName: item.fileName,
        previewUrl: item.filePath,
      }));
    }
  },
  { immediate: true },
);

// Format output JSON sesuai spesifikasi API
const formattedDocumentation = computed<DocumentationApiPayload[]>(() => {
  return imageList.value.map((item) => ({
    category: item.category,
    filePath: item.filePath,
    fileName: item.fileName,
  }));
});

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan.");
      target.value = "";
      return;
    }
    selectedFile.value = file;
  }
}

async function handleUpload() {
  if (!selectedFile.value) {
    toast.error("Pilih file gambar terlebih dahulu.");
    return;
  }
  if (!selectedCategory.value) {
    toast.error("Pilih kategori gambar terlebih dahulu.");
    return;
  }

  const categoryFormatted = toKebabCase(selectedCategory.value);
  const computedFilePath = `${props.folderPath}/${categoryFormatted}`;
  const fileToUpload = selectedFile.value;

  try {
    const res = await uploadStore.upload({
      file: fileToUpload,
      filePath: computedFilePath,
    });

    const finalFileName =
      (res as any)?.fileName ||
      (res as any)?.data?.fileName ||
      fileToUpload.name;

    const previewUrl =
      (res as any)?.fileUrl ||
      (res as any)?.url ||
      URL.createObjectURL(fileToUpload);

    imageList.value.push({
      id: `${Date.now()}-${Math.random()}`,
      category: selectedCategory.value,
      filePath: computedFilePath,
      fileName: finalFileName,
      previewUrl,
    });

    emit("update:modelValue", formattedDocumentation.value);
    toast.success("Gambar berhasil diunggah.");

    // Reset input
    selectedFile.value = null;
    if (fileInputRef.value) fileInputRef.value.value = "";
  } catch (err: any) {
    toast.error(err?.message || "Gagal mengunggah gambar.");
  }
}

function handleDelete(itemIndex: number) {
  imageList.value.splice(itemIndex, 1);
  emit("update:modelValue", formattedDocumentation.value);
  toast.success("Foto dihapus dari daftar.");
}

function handleOpenDetail(item: UploadedImageItem) {
  activePreviewItem.value = item;
  previewModalOpen.value = true;
}

function handleCloseModal() {
  previewModalOpen.value = false;
  activePreviewItem.value = null;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Form Area Unggah Gambar (disembunyikan saat mode detail) -->
    <div
      v-if="!isDetailMode"
      class="p-5 border rounded-xl bg-card shadow-sm space-y-4"
    >
      <h2
        class="text-base font-semibold tracking-tight flex items-center gap-2"
      >
        <RiUploadCloud2Line class="size-5 text-primary" />
        Unggah Dokumentasi Kerusakan
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <!-- Kategori -->
        <div class="space-y-1.5 md:col-span-1">
          <label class="text-xs font-medium text-muted-foreground"
            >Kategori</label
          >
          <select
            v-model="selectedCategory"
            class="w-full text-sm border rounded-lg p-2.5 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            :disabled="uploadStore.isUploading"
          >
            <option
              v-for="cat in CATEGORY_OPTIONS"
              :key="cat.value"
              :value="cat.value"
            >
              {{ cat.text }}
            </option>
          </select>
        </div>

        <!-- Pilih File -->
        <div class="space-y-1.5 md:col-span-1">
          <label class="text-xs font-medium text-muted-foreground"
            >Pilih Berkas</label
          >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="w-full text-xs border rounded-lg p-2 bg-background file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            :disabled="uploadStore.isUploading"
            @change="handleFileChange"
          />
        </div>

        <!-- Tombol Unggah -->
        <div class="md:col-span-1">
          <Button
            type="button"
            class="w-full"
            :disabled="!selectedFile || uploadStore.isUploading"
            @click="handleUpload"
          >
            <RiLoader4Line
              v-if="uploadStore.isUploading"
              class="size-4 mr-2 animate-spin"
            />
            <RiImageAddLine v-else class="size-4 mr-2" />
            {{
              uploadStore.isUploading
                ? `Mengunggah (${uploadStore.uploadProgress}%)`
                : "Unggah Gambar"
            }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Tabel Visualisasi Gambar -->
    <div class="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div class="p-4 border-b flex items-center justify-between">
        <h3 class="text-sm font-semibold">Daftar Dokumentasi Terunggah</h3>
        <span class="text-xs text-muted-foreground">
          Total: {{ imageList.length }} berkas
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead
            class="bg-muted/50 text-xs font-medium text-muted-foreground uppercase border-b"
          >
            <tr>
              <th class="px-4 py-3 w-12 text-center">No</th>
              <th class="px-4 py-3">Kategori</th>
              <th class="hidden md:table-cell px-4 py-3">FilePath</th>
              <th class="hidden md:table-cell px-4 py-3">FileName</th>
              <th class="px-4 py-3 w-32 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-if="imageList.length === 0">
              <td
                colspan="5"
                class="px-4 py-8 text-center text-muted-foreground text-xs"
              >
                Belum ada gambar yang diunggah.
              </td>
            </tr>
            <tr
              v-for="(item, index) in imageList"
              :key="item.id || index"
              class="hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3 text-center text-xs font-medium">
                {{ index + 1 }}
              </td>
              <td class="px-4 py-3 font-medium">{{ item.category }}</td>
              <td
                class="hidden md:table-cell px-4 py-3 text-xs font-mono text-muted-foreground"
              >
                {{ item.filePath }}
              </td>
              <td class="hidden md:table-cell px-4 py-3 text-xs">
                {{ item.fileName }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    title="Lihat Gambar"
                    @click="handleOpenDetail(item)"
                  >
                    <RiEyeLine class="size-4 text-primary" />
                  </Button>
                  <Button
                    v-if="!isDetailMode"
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    title="Hapus"
                    class="hover:text-destructive"
                    @click="handleDelete(index)"
                  >
                    <RiDeleteBinLine class="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Preview Detail Gambar -->
    <div
      v-if="previewModalOpen && activePreviewItem"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="handleCloseModal"
    >
      <div
        class="bg-background rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl"
      >
        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h4 class="font-semibold text-sm">
              {{ activePreviewItem.category }}
            </h4>
            <p class="text-xs text-muted-foreground font-mono">
              {{ activePreviewItem.fileName }}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" @click="handleCloseModal">
            <RiCloseLine class="size-5" />
          </Button>
        </div>

        <div
          class="flex items-center justify-center bg-muted/40 rounded-lg overflow-hidden max-h-[70vh]"
        >
          <img
            v-if="
              activePreviewItem.previewUrl ||
              (activePreviewItem.filePath && activePreviewItem.fileName)
            "
            :src="
              activePreviewItem.previewUrl?.startsWith('blob:')
                ? activePreviewItem.previewUrl
                : `http://localhost:3000/uploads/${activePreviewItem.filePath}/${activePreviewItem.fileName}`
            "
            :alt="activePreviewItem.fileName"
            class="object-contain max-h-[65vh] w-full"
          />
          <div v-else class="p-12 text-center text-sm text-muted-foreground">
            Pratinjau gambar tidak tersedia untuk berkas ini.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
