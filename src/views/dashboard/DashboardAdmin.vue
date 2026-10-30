<!-- 
 https://chatgpt.com/s/t_6ae376940fa481918f882c66ad8319d6
 total survey dan total masing2 status

 pengaduan complain
 persetujuan akun
 dalam bentuk grafik
    distribusi kerusakan
    total survey bulanan
    total kehilangan bulanan
    distribusi status
    total survey tiap bencana

-->

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiFileList3Line,
  RiTeamLine,
  RiTimeLine,
} from "@remixicon/vue";
import { Button } from "@/components/ui/button";
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

const userName = computed(() => (auth.user as any)?.nama || "Administrator");
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
          Tinjau status verifikasi dan ringkasan data lapangan pascabencana
          secara menyeluruh.
        </p>
      </div>
      <div class="mt-2 sm:mt-0">
        <Button
          variant="outline"
          class="h-9 gap-1.5 text-sm"
          @click="router.push('/survey')"
        >
          <RiFileList3Line class="size-4" />
          Tinjau Semua Survei
        </Button>
      </div>
    </div>

    <!-- Ringkasan Status Survei -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Verifikasi Masuk</CardTitle>
          <RiTimeLine class="size-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">Survei Baru</div>
          <p class="text-muted-foreground text-xs">Menunggu peninjauan admin</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Tahap Anggaran</CardTitle>
          <RiFileList3Line class="size-4 text-info" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">Penganggaran</div>
          <p class="text-muted-foreground text-xs">
            Survei lolos verifikasi fisik
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Survei Tuntas</CardTitle>
          <RiCheckboxCircleLine class="size-4 text-success" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">Selesai</div>
          <p class="text-muted-foreground text-xs">
            Telah memiliki sumber dana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Pengguna Aktif</CardTitle>
          <RiTeamLine class="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">Surveyor & Admin</div>
          <p class="text-muted-foreground text-xs">
            Petugas terdaftar di sistem
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Akses Cepat Menu Admin -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card
        class="cursor-pointer transition-colors hover:border-primary/50"
        @click="router.push('/survey')"
      >
        <CardHeader>
          <CardTitle class="text-base">Kelola & Validasi Survei</CardTitle>
          <CardDescription class="text-xs">
            Lihat daftar keseluruhan survei, filter per bencana/wilayah, dan
            perbarui status survei.
          </CardDescription>
        </CardHeader>
        <CardContent
          class="flex items-center gap-1 text-xs font-medium text-primary"
        >
          Buka data survei <RiArrowRightLine class="size-3.5" />
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer transition-colors hover:border-primary/50"
        @click="router.push('/user/surveyors')"
      >
        <CardHeader>
          <CardTitle class="text-base">Manajemen Surveyor</CardTitle>
          <CardDescription class="text-xs">
            Persetujuan registrasi akun surveyor baru dan pengaturan status
            keaktifan penugasan.
          </CardDescription>
        </CardHeader>
        <CardContent
          class="flex items-center gap-1 text-xs font-medium text-primary"
        >
          Kelola surveyor <RiArrowRightLine class="size-3.5" />
        </CardContent>
      </Card>

      <Card
        class="cursor-pointer transition-colors hover:border-primary/50"
        @click="router.push('/master/bencana')"
      >
        <CardHeader>
          <CardTitle class="text-base">Data Master Bencana</CardTitle>
          <CardDescription class="text-xs">
            Kelola referensi kejadian bencana, wilayah administratif, dan
            komponen kerusakan.
          </CardDescription>
        </CardHeader>
        <CardContent
          class="flex items-center gap-1 text-xs font-medium text-primary"
        >
          Buka master bencana <RiArrowRightLine class="size-3.5" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
