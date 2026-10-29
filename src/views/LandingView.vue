<script setup lang="ts">
import {
  RiAlarmWarningLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBuilding2Line,
  RiCustomerService2Line,
  RiDatabase2Line,
  RiFileList3Line,
  RiHome4Line,
} from "@remixicon/vue";
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDisasterNews, type NewsItem } from "@/services/news";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const loggedIn = computed(() => !!auth.role);
const year = new Date().getFullYear();

const NEWS_PAGE_SIZE = 6;
const NEWS_MAX_PAGES = 3;

const news = ref<NewsItem[]>([]);
const newsPage = ref(1);
const newsPageCount = computed(() =>
  Math.max(1, Math.ceil(news.value.length / NEWS_PAGE_SIZE)),
);
const pagedNews = computed(() =>
  news.value.slice(
    (newsPage.value - 1) * NEWS_PAGE_SIZE,
    newsPage.value * NEWS_PAGE_SIZE,
  ),
);
const newsLoading = ref(true);
const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// The news section is optional: it stays hidden when nothing can be loaded.
onMounted(async () => {
  try {
    news.value = await fetchDisasterNews(NEWS_PAGE_SIZE * NEWS_MAX_PAGES);
  } catch {
    news.value = [];
  } finally {
    newsLoading.value = false;
  }
});

const features = [
  {
    icon: RiAlarmWarningLine,
    title: "Data Bencana",
    text: "Catat kejadian bencana lengkap dengan kategori, tanggal, dan lokasi sebagai dasar seluruh survei.",
  },
  {
    icon: RiFileList3Line,
    title: "Survei Lapangan",
    text: "Surveyor mengisi data penduduk, titik koordinat di peta, rincian kerusakan, kerugian, dan foto dokumentasi.",
  },
  {
    icon: RiHome4Line,
    title: "Penilaian Kerusakan Rumah",
    text: "Nilai tingkat kerusakan tiap komponen rumah (ringan, sedang, berat, atau tidak memenuhi kriteria).",
  },
  {
    icon: RiBuilding2Line,
    title: "Penilaian Kerugian",
    text: "Hitung kerugian per sektor dan sub-sektor sehingga dampak bencana tergambar jelas.",
  },
  {
    icon: RiCustomerService2Line,
    title: "Komplain dan Tindak Lanjut",
    text: "Tanggapi komplain atas hasil survei, lalu pantau status dari verifikasi hingga pembangunan selesai.",
  },
  {
    icon: RiDatabase2Line,
    title: "Data Master Terpusat",
    text: "Wilayah dari provinsi sampai desa/kelurahan, sektor, dan komponen rumah dikelola di satu tempat.",
  },
];

const steps = [
  { title: "Bencana dicatat", text: "Admin mendaftarkan kejadian bencana." },
  { title: "Survei dilakukan", text: "Surveyor mendata kondisi di lapangan." },
  { title: "Penilaian disusun", text: "Kerusakan dan kerugian dinilai." },
  { title: "Tindak lanjut", text: "Status berjalan hingga selesai dibangun." },
];
</script>

<template>
  <div class="bg-background text-foreground flex min-h-svh flex-col">
    <!-- Stays in the top-right corner while scrolling; signed-in users do not file complaints. -->
    <div
      v-if="!loggedIn"
      class="fixed top-4 right-4 z-50 sm:top-6 sm:right-6"
    >
      <Button
        as-child
        class="h-10 bg-black px-4 text-sm text-white ring-1 ring-white/40 hover:bg-black/90 dark:bg-white dark:text-black dark:ring-0 dark:hover:bg-white/90"
      >
        <RouterLink to="/ajukan-komplain">
          <RiCustomerService2Line />
          Ajukan Komplain
        </RouterLink>
      </Button>
    </div>

    <main class="flex-1">
      <section
        class="relative isolate flex min-h-svh flex-col items-center overflow-hidden"
      >
        <img
          src="/images/kebakaran-hutan.jpg"
          alt=""
          class="absolute inset-0 -z-10 size-full object-cover"
        />
        <div class="absolute inset-0 -z-10 bg-black/65" />
        <div
          class="mx-auto my-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center text-white"
        >
          <div class="flex flex-col items-center gap-3">
            <h1 class="text-5xl font-bold tracking-wide sm:text-6xl">
              SIPANTAS
            </h1>
            <h2
              class="max-w-2xl text-xl font-medium text-balance text-white/90 sm:text-3xl"
            >
              Sistem Aplikasi Pendataan Pasca Bencana
            </h2>
          </div>
          <p class="text-base text-pretty text-white/80 sm:text-lg">
            Sistem Aplikasi untuk membantu surveyor dalam mencatat bencana, mensurvei
            lokasi terdampak, menilai kerusakan rumah dan kerugian, serta
            memantau tindak lanjutnya.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row">
            <Button v-if="loggedIn" as-child class="h-11 px-6 text-sm">
              <RouterLink :to="{ name: 'dashboard' }">
                Buka dashboard
              </RouterLink>
            </Button>
            <template v-else>
              <!-- Each button uses its role's theme colour (admin: violet, surveyor: teal). -->
              <Button as-child class="h-11 px-6 text-sm">
                <RouterLink to="/login/admin">
                  Masuk sebagai Admin
                </RouterLink>
              </Button>
              <Button as-child data-theme="surveyor" class="h-11 px-6 text-sm">
                <RouterLink to="/login/surveyor">
                  Masuk sebagai Surveyor
                </RouterLink>
              </Button>
            </template>
          </div>
          <p v-if="!loggedIn" class="text-sm text-white/80">
            <span class="mr-1">Belum punya akun surveyor?</span>
            <RouterLink to="/register" class="font-medium text-white underline">
              Daftar di sini
            </RouterLink>
          </p>
        </div>
      </section>

      <section class="bg-muted/50 border-y">
        <div class="mx-auto w-full max-w-6xl px-4 py-16">
          <div class="mb-10 flex flex-col gap-2 text-center">
            <h2 class="text-2xl font-semibold">Fitur utama</h2>
            <p class="text-muted-foreground text-sm">
              Semua yang dibutuhkan untuk mendata dampak bencana.
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card v-for="f in features" :key="f.title" class="text-sm">
              <CardHeader class="gap-3">
                <div
                  class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl"
                >
                  <component :is="f.icon" class="size-5" />
                </div>
                <CardTitle class="text-base">{{ f.title }}</CardTitle>
              </CardHeader>
              <CardContent class="text-muted-foreground">
                {{ f.text }}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section class="mx-auto w-full max-w-6xl px-4 py-16">
        <div class="mb-10 flex flex-col gap-2 text-center">
          <h2 class="text-2xl font-semibold">Alur Kerja</h2>
          <p class="text-muted-foreground text-sm">
            Empat tahap dari kejadian bencana hingga pembangunan kembali.
          </p>
        </div>
        <ol class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <li
            v-for="(s, i) in steps"
            :key="s.title"
            class="flex flex-col gap-3"
          >
            <span
              class="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold"
            >
              {{ i + 1 }}
            </span>
            <h3 class="text-base font-semibold">{{ s.title }}</h3>
            <p class="text-muted-foreground text-sm">{{ s.text }}</p>
          </li>
        </ol>
      </section>

      <section v-if="newsLoading || news.length" class="bg-muted/50 border-t">
        <div class="mx-auto w-full max-w-6xl px-4 py-16">
          <div class="mb-10 flex flex-col gap-2 text-center">
            <h2 class="text-2xl font-semibold">Berita bencana terkini</h2>
            <p class="text-muted-foreground text-sm">
              Kabar terbaru hari ini
            </p>
          </div>

          <div
            v-if="newsLoading"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Skeleton v-for="n in 3" :key="n" class="h-72 rounded-xl" />
          </div>

          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              v-for="item in pagedNews"
              :key="item.link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
              class="group focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2"
            >
              <Card
                class="group-hover:border-primary/50 h-full gap-0 overflow-hidden py-0 text-sm transition-colors"
              >
                <img
                  v-if="item.image"
                  :src="item.image"
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  class="aspect-video w-full object-cover"
                />
                <div
                  v-else
                  class="bg-muted aspect-video w-full"
                  aria-hidden="true"
                />
                <CardContent class="flex flex-col gap-2 p-4">
                  <p class="text-muted-foreground text-xs">
                    {{ item.source }}
                    <template v-if="item.publishedAt">
                      &middot; {{ dateFormat.format(item.publishedAt) }}
                    </template>
                  </p>
                  <h3 class="line-clamp-3 text-base font-semibold">
                    {{ item.title }}
                  </h3>
                  <p v-if="item.summary" class="text-muted-foreground line-clamp-2">
                    {{ item.summary }}
                  </p>
                </CardContent>
              </Card>
            </a>
          </div>

          <nav
            v-if="!newsLoading && newsPageCount > 1"
            aria-label="Halaman berita"
            class="mt-8 flex items-center justify-center gap-2"
          >
            <Button
              variant="outline"
              size="icon"
              class="size-9"
              aria-label="Halaman sebelumnya"
              :disabled="newsPage === 1"
              @click="newsPage--"
            >
              <RiArrowLeftSLine class="size-5" />
            </Button>
            <Button
              v-for="p in newsPageCount"
              :key="p"
              :variant="p === newsPage ? 'default' : 'outline'"
              size="icon"
              class="size-9 text-sm"
              :aria-label="`Halaman ${p}`"
              :aria-current="p === newsPage ? 'page' : undefined"
              @click="newsPage = p"
            >
              {{ p }}
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="size-9"
              aria-label="Halaman berikutnya"
              :disabled="newsPage === newsPageCount"
              @click="newsPage++"
            >
              <RiArrowRightSLine class="size-5" />
            </Button>
          </nav>
        </div>
      </section>
    </main>

    <footer class="border-t">
      <div
        class="text-muted-foreground mx-auto flex h-16 w-full max-w-6xl items-center justify-center px-4 text-sm"
      >
        &copy; {{ year }} SIPANTAS. Hak cipta dilindungi.
      </div>
    </footer>
  </div>
</template>
