<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  RiAlarmWarningLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiFileList3Line,
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiTeamLine,
  RiBuildingLine,
} from "@remixicon/vue";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useDashboardAdminStore } from "@/stores/dashboard-admin";

const auth = useAuthStore();
const dashboardStore = useDashboardAdminStore();

const userName = computed(() => (auth.user as any)?.nama || "Administrator");

onMounted(async () => {
  try {
    await dashboardStore.fetchAllDashboardData();
  } catch {
    // Error di-handle di state dashboardStore.error
  }
});

const STATUS_STYLE_MAP: Record<string, { color: string; bgClass: string }> = {
  Pending: { color: "#f59e0b", bgClass: "bg-amber-500" },
  OnVerification: { color: "#3b82f6", bgClass: "bg-blue-500" },
  OnBudgeting: { color: "#8b5cf6", bgClass: "bg-purple-500" },
  Completed: { color: "#10b981", bgClass: "bg-emerald-500" },
};

const DAMAGE_STYLE_MAP: Record<string, { color: string; barColor: string }> = {
  "Rusak Berat": { color: "bg-rose-500", barColor: "#f43f5e" },
  "Rusak Sedang": { color: "bg-amber-500", barColor: "#f59e0b" },
  "Rusak Ringan": { color: "bg-sky-500", barColor: "#0ea5e9" },
  "TMK (Tidak Memenuhi Kriteria)": {
    color: "bg-slate-400",
    barColor: "#94a3b8",
  },
};

const DISASTER_PALETTE = [
  "bg-indigo-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
];

// --- 1. DATA STATUS SURVEI (CARD & DISTRIBUSI STATUS) ---
const surveyStatusStats = computed(() => {
  return dashboardStore.surveyStatuses.map((item) => ({
    ...item,
    color: STATUS_STYLE_MAP[item.key]?.color ?? "#64748b",
    bgClass: STATUS_STYLE_MAP[item.key]?.bgClass ?? "bg-slate-500",
  }));
});

const totalSurveys = computed(() =>
  surveyStatusStats.value.reduce((acc, curr) => acc + curr.count, 0),
);

// --- 2. DATA PERSETUJUAN AKUN SURVEYOR (CARD & DONUT) ---
const surveyorApprovalStats = computed(() => dashboardStore.surveyorApprovals);

const totalSurveyors = computed(
  () =>
    surveyorApprovalStats.value.pending +
    surveyorApprovalStats.value.approved +
    surveyorApprovalStats.value.rejected,
);

// --- 3. DATA TOTAL BENCANA (CARD) ---
const disasterStats = computed(() => ({
  total: dashboardStore.disasterSummary.total,
  active: dashboardStore.disasterSummary.active,
  resolved: dashboardStore.disasterSummary.inactive,
}));

// --- 4. GRAFIK: DISTRIBUSI TINGKAT KERUSAKAN ---
const damageDistribution = computed(() => {
  return dashboardStore.damageDistributions.map((item) => ({
    ...item,
    color: DAMAGE_STYLE_MAP[item.level]?.color ?? "bg-slate-400",
    barColor: DAMAGE_STYLE_MAP[item.level]?.barColor ?? "#94a3b8",
  }));
});

// --- 5. GRAFIK: TOTAL SURVEY BULANAN & KEHILANGAN BULANAN (12 BULAN TERAKHIR) ---
const monthlyTrends = computed(() => {
  return dashboardStore.monthlyTrends.map((item) => ({
    month: item.month,
    surveyCount: item.survey_count,
    totalLoss: item.total_loss,
  }));
});

const maxMonthlySurvey = computed(() =>
  Math.max(...monthlyTrends.value.map((m) => m.surveyCount), 1),
);

const surveyChartPoints = computed(() => {
  const data = monthlyTrends.value;
  if (!data.length) return [];

  const width = 600;
  const height = 180;
  const padTop = 24;
  const padBottom = 26;
  const padLeft = 32;
  const padRight = 20;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const maxVal = maxMonthlySurvey.value;

  return data.map((item, i) => {
    const x =
      data.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (i / (data.length - 1)) * plotWidth;
    const y = padTop + plotHeight - (item.surveyCount / maxVal) * plotHeight;
    return {
      ...item,
      x,
      y,
    };
  });
});

const surveyLinePath = computed(() => {
  const pts = surveyChartPoints.value;
  if (!pts.length) return "";
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
});

const surveyAreaPath = computed(() => {
  const pts = surveyChartPoints.value;
  if (!pts.length) return "";
  const baseY = 180 - 26;
  return `${surveyLinePath.value} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;
});

const maxMonthlyLoss = computed(() =>
  Math.max(...monthlyTrends.value.map((m) => m.totalLoss), 1),
);

const totalYearLoss = computed(() =>
  monthlyTrends.value.reduce((acc, curr) => acc + curr.totalLoss, 0),
);

// --- 6. GRAFIK: TOTAL SURVEY TIAP BENCANA ---
const disasterSurveyStats = computed(() => {
  return dashboardStore.disasterSurveys.map((item, index) => ({
    disasterCode: item.disaster_code,
    name: item.name,
    count: item.count,
    color: DISASTER_PALETTE[index % DISASTER_PALETTE.length],
  }));
});

const maxDisasterSurveyCount = computed(() =>
  Math.max(...disasterSurveyStats.value.map((d) => d.count), 1),
);

// Helpers
const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(val);
};

const formatNumber = (val: number) => {
  return new Intl.NumberFormat("id-ID").format(val);
};

// Donut SVG Calculations for Survey Status
const statusDonutSegments = computed(() => {
  const total = totalSurveys.value;
  if (!total) return [];

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;
  return surveyStatusStats.value
    .filter((item) => item.count > 0)
    .map((item) => {
      const percentage = item.count / total;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += percentage * circumference;

      return {
        ...item,
        percentage: Math.round(percentage * 100),
        strokeDasharray,
        strokeDashoffset,
      };
    });
});

const statusLegendItems = computed(() => {
  const total = totalSurveys.value || 1;
  return surveyStatusStats.value.map((item) => ({
    ...item,
    percentage:
      totalSurveys.value > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Selamat datang, {{ userName }}
      </h1>
      <p class="text-muted-foreground text-sm">
        Dashboard analisis komprehensif data survei, kerusakan, kerugian, dan
        persetujuan surveyor.
      </p>
    </div>

    <!-- ========================================== -->
    <!-- 1. KARTU RINGKASAN UTAMA (CARDS)           -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- Card 1: Total Survey & Detail Status -->
      <Card class="shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Total Survei</CardTitle>
          <div class="rounded-lg bg-primary/10 p-2 text-primary">
            <RiFileList3Line class="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-extrabold tracking-tight">
            {{ formatNumber(totalSurveys) }}
          </div>
          <p class="text-muted-foreground mt-1 text-xs">
            Total data survei tercatat
          </p>

          <!-- Status Mini Grid -->
          <div class="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
            <div
              v-for="stat in surveyStatusStats"
              :key="stat.key"
              class="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5"
            >
              <div class="flex min-w-0 items-center gap-1.5">
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :style="{ backgroundColor: stat.color }"
                >
                </span>
                <span class="truncate text-muted-foreground text-xs">{{
                  stat.label
                }}</span>
              </div>
              <span class="ml-1 shrink-0 text-xs font-semibold">{{
                stat.count
              }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Card 2: Persetujuan Akun Surveyor -->
      <Card class="shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Persetujuan Akun</CardTitle>
          <div
            class="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400"
          >
            <RiTeamLine class="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-extrabold tracking-tight">
            {{ formatNumber(totalSurveyors) }}
          </div>
          <p class="text-muted-foreground mt-1 text-xs">
            Total akun surveyor terdaftar
          </p>

          <div class="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <div class="rounded-md bg-amber-500/10 p-1.5 dark:bg-amber-950/20">
              <span
                class="text-[11px] font-medium text-amber-600 dark:text-amber-400"
                >Menunggu</span
              >
              <p class="text-sm font-bold text-amber-700 dark:text-amber-300">
                {{ surveyorApprovalStats.pending }}
              </p>
            </div>
            <div
              class="rounded-md bg-emerald-500/10 p-1.5 dark:bg-emerald-950/20"
            >
              <span
                class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                >Disetujui</span
              >
              <p
                class="text-sm font-bold text-emerald-700 dark:text-emerald-300"
              >
                {{ surveyorApprovalStats.approved }}
              </p>
            </div>
            <div class="rounded-md bg-rose-500/10 p-1.5 dark:bg-rose-950/20">
              <span
                class="text-[11px] font-medium text-rose-600 dark:text-rose-400"
                >Ditolak</span
              >
              <p class="text-sm font-bold text-rose-700 dark:text-rose-300">
                {{ surveyorApprovalStats.rejected }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Card 3: Total Kejadian Bencana -->
      <Card class="shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Kejadian Bencana</CardTitle>
          <div
            class="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400"
          >
            <RiAlarmWarningLine class="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-extrabold tracking-tight">
            {{ formatNumber(disasterStats.total) }}
          </div>
          <p class="text-muted-foreground mt-1 text-xs">
            Total kejadian bencana
          </p>

          <div class="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
            <div
              class="flex items-center gap-2 rounded-md bg-rose-500/10 p-2 sm:px-3 sm:py-2"
            >
              <RiAlertLine class="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <div>
                <span
                  class="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider"
                  >Aktif</span
                >
                <span class="text-sm font-bold text-rose-600 dark:text-rose-400"
                  >{{ disasterStats.active }} Bencana</span
                >
              </div>
            </div>
            <div
              class="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2 sm:px-3 sm:py-2"
            >
              <RiCheckboxCircleLine
                class="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              />
              <div>
                <span
                  class="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider"
                  >Selesai</span
                >
                <span
                  class="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  >{{ disasterStats.resolved }} Bencana</span
                >
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ========================================== -->
    <!-- 2. GRAFIK BULANAN: SURVEI & KERUGIAN       -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Grafik Total Survey Bulanan -->
      <Card class="shadow-sm">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-base font-semibold"
                >Total Survei Bulanan</CardTitle
              >
              <CardDescription
                >Tren jumlah survei yang masuk setiap bulan</CardDescription
              >
            </div>
            <RiLineChartLine class="text-muted-foreground h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            v-if="!monthlyTrends.length"
            class="flex h-56 items-center justify-center text-xs text-muted-foreground"
          >
            Belum ada data survei
          </div>
          <div v-else class="overflow-x-auto pb-1">
            <div
              class="relative flex h-56 min-w-[500px] w-full items-center justify-center overflow-hidden pt-2 sm:min-w-0"
            >
              <svg
                viewBox="0 0 600 180"
                class="h-full w-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="surveyAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stop-color="currentColor"
                      class="text-primary"
                      stop-opacity="0.28"
                    />
                    <stop
                      offset="100%"
                      stop-color="currentColor"
                      class="text-primary"
                      stop-opacity="0.0"
                    />
                  </linearGradient>
                </defs>

                <!-- Grid Guide Lines -->
                <line
                  x1="32"
                  y1="24"
                  x2="580"
                  y2="24"
                  stroke="currentColor"
                  class="text-muted/30"
                  stroke-dasharray="3 3"
                  stroke-width="1"
                />
                <line
                  x1="32"
                  y1="89"
                  x2="580"
                  y2="89"
                  stroke="currentColor"
                  class="text-muted/30"
                  stroke-dasharray="3 3"
                  stroke-width="1"
                />
                <line
                  x1="32"
                  y1="154"
                  x2="580"
                  y2="154"
                  stroke="currentColor"
                  class="text-muted/40"
                  stroke-width="1"
                />

                <!-- Area & Line Path -->
                <path :d="surveyAreaPath" fill="url(#surveyAreaGradient)" />
                <path
                  :d="surveyLinePath"
                  fill="none"
                  stroke="currentColor"
                  class="text-primary"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Data Points, Values & Month Labels -->
                <g v-for="pt in surveyChartPoints" :key="pt.month">
                  <text
                    :x="pt.x"
                    :y="pt.y - 7"
                    text-anchor="middle"
                    class="fill-primary text-[10px] font-semibold"
                  >
                    {{ pt.surveyCount }}
                  </text>
                  <circle
                    :cx="pt.x"
                    :cy="pt.y"
                    r="3.5"
                    class="fill-background stroke-primary"
                    stroke-width="2"
                  />
                  <text
                    :x="pt.x"
                    :y="170"
                    text-anchor="middle"
                    class="fill-muted-foreground text-[10px] font-medium"
                  >
                    {{ pt.month }}
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Grafik Total Kerugian Bulanan -->
      <Card class="shadow-sm">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-base font-semibold"
                >Total Kehilangan & Kerugian Bulanan</CardTitle
              >
              <CardDescription>
                Estimasi total:
                <span class="font-bold text-foreground">{{
                  formatRupiah(totalYearLoss)
                }}</span>
              </CardDescription>
            </div>
            <RiMoneyDollarCircleLine class="text-muted-foreground h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            v-if="!monthlyTrends.length"
            class="flex h-56 items-center justify-center text-xs text-muted-foreground"
          >
            Belum ada data kerugian
          </div>
          <div
            v-else
            class="flex h-56 items-end gap-2 pt-6 sm:gap-3 overflow-x-auto pb-1"
          >
            <div
              v-for="item in monthlyTrends"
              :key="item.month"
              class="flex flex-1 min-w-[32px] sm:min-w-0 flex-col items-center gap-2"
            >
              <span
                class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-full"
              >
                {{ formatRupiah(item.totalLoss) }}
              </span>
              <div
                class="relative w-full rounded-t-md bg-muted flex items-end justify-center overflow-hidden h-36"
              >
                <div
                  class="w-full rounded-t-md bg-emerald-500 transition-all duration-500 hover:opacity-85"
                  :style="{
                    height: `${(item.totalLoss / maxMonthlyLoss) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="text-muted-foreground text-[11px] font-medium">{{
                item.month
              }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ========================================== -->
    <!-- 3. GRAFIK KOMPOSISI & DISTRIBUSI          -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- Grafik Distribusi Tingkat Kerusakan -->
      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="text-base font-semibold"
            >Distribusi Kerusakan</CardTitle
          >
          <CardDescription
            >Persentase tingkat kerusakan bangunan/aset</CardDescription
          >
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-if="!damageDistribution.length"
            class="py-8 text-center text-xs text-muted-foreground"
          >
            Belum ada data kerusakan
          </div>
          <div
            v-for="item in damageDistribution"
            :key="item.level"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">{{ item.level }}</span>
              <span class="text-muted-foreground font-semibold">
                {{ item.count }} unit ({{ item.percentage }}%)
              </span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="item.color"
                :style="{ width: `${item.percentage}%` }"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Grafik Distribusi Status Survei (Donut) -->
      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="text-base font-semibold"
            >Distribusi Status Survei</CardTitle
          >
          <CardDescription
            >Status alur penanganan survei terkini</CardDescription
          >
        </CardHeader>
        <CardContent class="flex flex-col items-center">
          <div class="relative flex h-40 w-40 items-center justify-center">
            <svg
              class="h-full w-full -rotate-90 transform"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="currentColor"
                stroke-width="12"
                class="text-muted"
              />
              <circle
                v-for="(seg, idx) in statusDonutSegments"
                :key="idx"
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                :stroke="seg.color"
                stroke-width="12"
                :stroke-dasharray="seg.strokeDasharray"
                :stroke-dashoffset="seg.strokeDashoffset"
                stroke-linecap="round"
                class="transition-all duration-500"
              />
            </svg>
            <div class="absolute flex flex-col items-center">
              <span class="text-xl font-black">{{ totalSurveys }}</span>
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold"
                >Survei</span
              >
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-4 grid w-full grid-cols-2 gap-2 text-xs">
            <div
              v-for="item in statusLegendItems"
              :key="item.key"
              class="flex items-center gap-1.5"
            >
              <span
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: item.color }"
              ></span>
              <span class="text-muted-foreground">{{ item.label }}:</span>
              <span class="font-semibold">{{ item.percentage }}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ========================================== -->
    <!-- 4. TOTAL SURVEY TIAP BENCANA               -->
    <!-- ========================================== -->
    <Card class="shadow-sm">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-base font-semibold"
              >Total Survei Tiap Kejadian Bencana</CardTitle
            >
            <CardDescription
              >Akumulasi survei lapangan berdasarkan penetapan
              bencana</CardDescription
            >
          </div>
          <RiBuildingLine class="text-muted-foreground h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div
          v-if="!disasterSurveyStats.length"
          class="py-8 text-center text-xs text-muted-foreground"
        >
          Belum ada data survei bencana
        </div>
        <div
          v-for="disaster in disasterSurveyStats"
          :key="disaster.disasterCode"
          class="space-y-1.5"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-1 text-xs"
          >
            <div class="flex min-w-0 items-center gap-2">
              <Badge variant="outline" class="shrink-0 font-mono text-[10px]">
                {{ disaster.disasterCode }}
              </Badge>
              <span class="truncate font-medium">{{ disaster.name }}</span>
            </div>
            <span class="shrink-0 font-bold">{{ disaster.count }} Survei</span>
          </div>
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="disaster.color"
              :style="{
                width: `${(disaster.count / maxDisasterSurveyCount) * 100}%`,
              }"
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
