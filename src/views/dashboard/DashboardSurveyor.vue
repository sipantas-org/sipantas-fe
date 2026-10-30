<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiFileList3Line,
  RiMapPinLine,
  RiRestartLine,
} from "@remixicon/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

const userName = computed(() => (auth.user as any)?.nama || "Surveyor");
const surveyorLocation = computed(() => {
  const user = auth.user as any;
  if (!user) return null;
  const city = user.cityName || user.idCity;
  const province = user.provinceName || user.idProvince;
  if (!city && !province) return null;
  return [city, province].filter(Boolean).join(", ");
});

const dummyStats = ref({
  totalSubmitted: 48,
  completed: 35,
  onComplain: 3,
  ringan: 20,
  sedang: 14,
  berat: 9,
  tmk: 5,
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Selamat datang, {{ userName }}
        </h1>
        <p class="text-muted-foreground text-sm">
          Pantau progres pendataan survei lapangan Anda dan kelola laporan
          kerusakan.
        </p>
      </div>
    </div>

    <!-- Ringkasan Info Surveyor -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card class="sm:col-span-2 lg:col-span-2">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Wilayah Penugasan</CardTitle>
          <RiMapPinLine class="size-4 shrink-0 text-primary" />
        </CardHeader>
        <CardContent>
          <div
            class="text-base font-semibold leading-snug sm:text-lg"
            :title="surveyorLocation ?? undefined"
          >
            {{ surveyorLocation ?? "Belum diatur" }}
          </div>
          <p class="mt-1 text-muted-foreground text-xs">
            Cakupan area penugasan Anda
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Survei Terkirim</CardTitle>
          <RiFileList3Line class="size-4 text-info" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ dummyStats.totalSubmitted }}
          </div>
          <p class="text-muted-foreground text-xs">
            Total data survei yang diinput
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Survei Selesai</CardTitle>
          <RiCheckboxCircleLine class="size-4 text-success" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-success">
            {{ dummyStats.completed }}
          </div>
          <p class="text-muted-foreground text-xs">
            Data tuntas dan lolos verifikasi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Proses Ulang</CardTitle>
          <RiRestartLine class="size-4 shrink-0 text-destructive" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-destructive">
            {{ dummyStats.onComplain }}
          </div>
          <p class="mt-1 text-muted-foreground text-xs">
            Perlu verifikasi & pendataan ulang
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Ringkasan Berdasarkan Tingkat Kerusakan -->
    <div>
      <h2
        class="mb-3 text-sm font-semibold tracking-tight text-muted-foreground"
      >
        SEBARAN TINGKAT KERUSAKAN
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Rusak Ringan -->
        <Card class="border-emerald-200/60 dark:border-emerald-950">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Rusak Ringan</CardTitle>
            <RiCheckboxCircleLine
              class="size-4 text-emerald-600 dark:text-emerald-400"
            />
          </CardHeader>
          <CardContent>
            <div
              class="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              {{ dummyStats.ringan }}
            </div>
            <p class="mt-1 text-muted-foreground text-xs">
              Kerusakan non-struktural / ringan
            </p>
          </CardContent>
        </Card>

        <!-- Rusak Sedang -->
        <Card class="border-amber-200/60 dark:border-amber-950">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Rusak Sedang</CardTitle>
            <RiAlertLine class="size-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {{ dummyStats.sedang }}
            </div>
            <p class="mt-1 text-muted-foreground text-xs">
              Kerusakan sebagian struktur bangunan
            </p>
          </CardContent>
        </Card>

        <!-- Rusak Berat -->
        <Card class="border-rose-200/60 dark:border-rose-950">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Rusak Berat</CardTitle>
            <RiAlertLine class="size-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {{ dummyStats.berat }}
            </div>
            <p class="mt-1 text-muted-foreground text-xs">
              Kerusakan struktur utama / roboh
            </p>
          </CardContent>
        </Card>

        <!-- TMK -->
        <Card class="border-muted">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">TMK</CardTitle>
            <RiCloseCircleLine class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-muted-foreground">
              {{ dummyStats.tmk }}
            </div>
            <p class="mt-1 text-muted-foreground text-xs">
              Tidak Memenuhi Kriteria bantuan
            </p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Panduan & Aksi Cepat Surveyor -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card
        class="cursor-pointer transition-colors hover:border-primary/50"
        @click="router.push('/survey/create')"
      >
        <CardHeader>
          <CardTitle class="text-base">Mulai Pendataan Baru</CardTitle>
          <CardDescription class="text-xs">
            Lakukan input penilaian kerusakan fisik rumah, aset furnitur, dan
            taksiran kerugian pascabencana.
          </CardDescription>
        </CardHeader>
        <CardContent
          class="flex items-center gap-1 text-xs font-medium text-primary"
        >
          Buka form survei <RiArrowRightLine class="size-3.5" />
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer transition-colors hover:border-primary/50"
        @click="router.push('/survey')"
      >
        <CardHeader>
          <CardTitle class="text-base">Daftar Hasil Pendataan</CardTitle>
          <CardDescription class="text-xs">
            Tinjau status verifikasi, ubah data survei berstatus Pending, atau
            pantau perbaikan data komplain.
          </CardDescription>
        </CardHeader>
        <CardContent
          class="flex items-center gap-1 text-xs font-medium text-primary"
        >
          Lihat survei saya <RiArrowRightLine class="size-3.5" />
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer transition-colors hover:border-destructive/50"
        @click="router.push('/survey')"
      >
        <CardHeader>
          <CardTitle class="text-base">Tindak Lanjut Komplain</CardTitle>
          <CardDescription class="text-xs">
            Periksa catatan sanggahan dari masyarakat dan lakukan pembaharuan
            bukti data kerusakan.
          </CardDescription>
        </CardHeader>
        <CardContent
          class="flex items-center gap-1 text-xs font-medium text-destructive"
        >
          Periksa komplain <RiArrowRightLine class="size-3.5" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
