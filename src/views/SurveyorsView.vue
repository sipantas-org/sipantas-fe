<script setup lang="ts">
import {
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
  RiMoreLine,
  RiUserForbidLine,
  RiUserFollowLine,
} from '@remixicon/vue'
import { computed, onMounted, ref, watch } from 'vue'
import TablePagination from '@/components/TablePagination.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/http'
import { fetchSurveyors, reviewSurveyor, updateSurveyorStatus } from '@/services/surveyors'
import type { BadgeVariants } from '@/components/ui/badge'
import type { ApprovalDecision, SurveyorListItem, SurveyorStatus } from '@/services/surveyors'

const STATUS_META: Record<SurveyorStatus, { label: string, variant: NonNullable<BadgeVariants['variant']> }> = {
  Pending: { label: 'Menunggu', variant: 'secondary' },
  Active: { label: 'Aktif', variant: 'default' },
  Inactive: { label: 'Nonaktif', variant: 'outline' },
  Rejected: { label: 'Ditolak', variant: 'destructive' },
}
const STATUSES = Object.keys(STATUS_META) as SurveyorStatus[]
const NOTICE_MS = 5000

const status = ref<SurveyorStatus | 'all'>('all')
const limit = ref(10)
const page = ref(1)

const items = ref<SurveyorListItem[]>([])
const total = ref(0)
const loading = ref(false)
const loadError = ref<string>()

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

// Only the latest request may update the table.
let loadId = 0

async function load() {
  const id = ++loadId
  loading.value = true
  loadError.value = undefined
  try {
    const result = await fetchSurveyors({
      status: status.value === 'all' ? undefined : status.value,
      page: page.value,
      limit: limit.value,
    })
    if (id !== loadId)
      return
    items.value = result.items
    total.value = result.total
    // Reviewing the last row of a page can leave it empty; step back one page.
    if (result.items.length === 0 && page.value > 1)
      page.value -= 1
  }
  catch (error) {
    if (id === loadId)
      loadError.value = errorMessage(error, 'Gagal memuat data surveyor.')
  }
  finally {
    if (id === loadId)
      loading.value = false
  }
}

onMounted(load)
watch(page, load)
watch([status, limit], () => {
  if (page.value !== 1)
    page.value = 1
  else
    load()
})

type Action = ApprovalDecision | 'Active' | 'Inactive'

// Dialog texts per action. Only approval/rejection takes a note (ApproveSurveyorDto.description).
const ACTIONS: Record<Action, { title: string, effect: string, confirm: string, done: string, destructive: boolean, note: boolean }> = {
  Approved: { title: 'Setujui surveyor?', effect: 'akan disetujui dan akunnya diaktifkan.', confirm: 'Setujui', done: 'disetujui', destructive: false, note: true },
  Rejected: { title: 'Tolak surveyor?', effect: 'akan ditolak pendaftarannya.', confirm: 'Tolak', done: 'ditolak', destructive: true, note: true },
  Active: { title: 'Aktifkan surveyor?', effect: 'akan diaktifkan kembali.', confirm: 'Aktifkan', done: 'diaktifkan', destructive: false, note: false },
  Inactive: { title: 'Nonaktifkan surveyor?', effect: 'tidak dapat masuk sampai diaktifkan kembali.', confirm: 'Nonaktifkan', done: 'dinonaktifkan', destructive: true, note: false },
}

const pending = ref<{ surveyor: SurveyorListItem, type: Action } | null>(null)
const note = ref('')
const submitting = ref(false)
const actionError = ref<string>()
const notice = ref<string>()
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const meta = computed(() => (pending.value ? ACTIONS[pending.value.type] : undefined))

function openAction(surveyor: SurveyorListItem, type: Action) {
  pending.value = { surveyor, type }
  note.value = ''
  actionError.value = undefined
}

function onActionOpenChange(open: boolean) {
  if (!open && !submitting.value)
    pending.value = null
}

async function submitAction() {
  if (!pending.value)
    return

  const { surveyor, type } = pending.value
  submitting.value = true
  actionError.value = undefined
  try {
    if (type === 'Active' || type === 'Inactive')
      await updateSurveyorStatus(surveyor.id, type)
    else
      await reviewSurveyor(surveyor.id, type, note.value.trim() || undefined)
    pending.value = null
    notice.value = `${surveyor.nama} berhasil ${ACTIONS[type].done}.`
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      notice.value = undefined
    }, NOTICE_MS)
    await load()
  }
  catch (error) {
    actionError.value = errorMessage(error, 'Gagal memproses permintaan. Silakan coba lagi.')
  }
  finally {
    submitting.value = false
  }
}

function statusOf(item: SurveyorListItem) {
  return STATUS_META[item.status as SurveyorStatus] ?? { label: item.status, variant: 'outline' as const }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">
        Data Surveyor
      </h1>
      <p class="text-muted-foreground text-sm">
        Kelola akun surveyor dan persetujuan pendaftarannya.
      </p>
    </div>

    <Alert v-if="notice" role="status" class="text-sm">
      <RiCheckboxCircleLine />
      <AlertDescription class="text-sm">
        {{ notice }}
      </AlertDescription>
    </Alert>

    <Card class="gap-0 py-0 text-sm">
      <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <label for="status-filter" class="text-muted-foreground shrink-0 text-sm">Status</label>
          <Select v-model="status">
            <SelectTrigger id="status-filter" class="w-full text-sm data-[size=default]:h-10 sm:w-48">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" class="text-sm">
                Semua status
              </SelectItem>
              <SelectItem v-for="item in STATUSES" :key="item" :value="item" class="text-sm">
                {{ STATUS_META[item].label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p class="text-muted-foreground text-sm">
          {{ total }} surveyor
        </p>
      </div>

      <Table class="text-sm">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="h-11 px-4">
              Surveyor
            </TableHead>
            <TableHead class="h-11 px-4">
              Kontak
            </TableHead>
            <TableHead class="h-11 px-4">
              Wilayah
            </TableHead>
            <TableHead class="h-11 px-4">
              Status
            </TableHead>
            <TableHead class="h-11 px-4">
              Terakhir masuk
            </TableHead>
            <TableHead class="h-11 w-14 px-4">
              <span class="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody :class="loading && items.length > 0 && 'opacity-60'">
          <TableRow v-for="item in items" :key="item.id">
            <TableCell class="px-4 py-3">
              <div class="font-medium">
                {{ item.nama }}
              </div>
              <div class="text-muted-foreground">
                NIP {{ item.nip }}
              </div>
            </TableCell>
            <TableCell class="px-4 py-3">
              <div>{{ item.email }}</div>
              <div class="text-muted-foreground">
                {{ item.nomorHp }}
              </div>
            </TableCell>
            <TableCell class="px-4 py-3">
              <div>{{ item.cityName ?? item.idCity }}</div>
              <div class="text-muted-foreground">
                Provinsi {{ item.provinceName ?? item.idProvince }}
              </div>
            </TableCell>
            <TableCell class="px-4 py-3">
              <Badge :variant="statusOf(item).variant" class="h-6 px-2.5 text-xs">
                {{ statusOf(item).label }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground px-4 py-3">
              {{ item.lastLogin ?? 'Belum pernah' }}
            </TableCell>
            <TableCell class="px-4 py-3 text-right">
              <DropdownMenu v-if="item.status !== 'Rejected'" :modal="false">
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-9" :aria-label="`Aksi untuk ${item.nama}`">
                    <RiMoreLine class="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <template v-if="item.status === 'Pending'">
                    <DropdownMenuItem class="h-9 text-sm" @select="openAction(item, 'Approved')">
                      <RiCheckLine />
                      Setujui
                    </DropdownMenuItem>
                    <DropdownMenuItem class="h-9 text-sm" variant="destructive" @select="openAction(item, 'Rejected')">
                      <RiCloseLine />
                      Tolak
                    </DropdownMenuItem>
                  </template>
                  <DropdownMenuItem v-else-if="item.status === 'Active'" class="h-9 text-sm" variant="destructive" @select="openAction(item, 'Inactive')">
                    <RiUserForbidLine />
                    Nonaktifkan
                  </DropdownMenuItem>
                  <DropdownMenuItem v-else-if="item.status === 'Inactive'" class="h-9 text-sm" @select="openAction(item, 'Active')">
                    <RiUserFollowLine />
                    Aktifkan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>

          <TableEmpty v-if="items.length === 0" :colspan="6" class="text-muted-foreground h-32 text-center">
            <div v-if="loadError" class="flex flex-col items-center gap-2">
              <span class="text-destructive">{{ loadError }}</span>
              <Button variant="outline" class="h-9 text-sm" @click="load">
                Coba lagi
              </Button>
            </div>
            <span v-else-if="loading">Memuat data...</span>
            <span v-else>{{ status === 'all' ? 'Belum ada surveyor.' : 'Tidak ada surveyor dengan status ini.' }}</span>
          </TableEmpty>
        </TableBody>
      </Table>

      <TablePagination v-model:page="page" v-model:limit="limit" :total="total" :item-count="items.length" />
    </Card>

    <Dialog :open="pending !== null" @update:open="onActionOpenChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader class="gap-1.5">
          <DialogTitle class="text-base">
            {{ meta?.title }}
          </DialogTitle>
          <DialogDescription class="text-sm">
            <template v-if="pending">
              Surveyor <strong>{{ pending.surveyor.nama }}</strong> (NIP {{ pending.surveyor.nip }}) {{ meta?.effect }}
            </template>
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-2">
          <template v-if="meta?.note">
            <label for="action-note" class="text-sm font-medium">Catatan (opsional)</label>
            <Textarea
              id="action-note"
              v-model="note"
              rows="3"
              class="text-sm"
              :placeholder="pending?.type === 'Approved' ? 'Contoh: Dokumen identitas dan NIP valid.' : 'Contoh: NIP tidak ditemukan.'"
              :disabled="submitting"
            />
          </template>
          <p v-if="actionError" role="alert" class="text-destructive text-sm">
            {{ actionError }}
          </p>
        </div>

        <DialogFooter class="gap-2">
          <Button variant="outline" class="h-10 text-sm" :disabled="submitting" @click="onActionOpenChange(false)">
            Batal
          </Button>
          <Button
            :variant="meta?.destructive ? 'destructive' : 'default'"
            class="h-10 text-sm"
            :disabled="submitting"
            @click="submitAction"
          >
            <RiLoader4Line v-if="submitting" class="animate-spin" />
            {{ submitting ? 'Memproses...' : meta?.confirm }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
