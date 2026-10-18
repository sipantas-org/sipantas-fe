import type { BadgeVariants } from '@/components/ui/badge'

type BadgeVariant = NonNullable<BadgeVariants['variant']>

const ACCOUNT_STATUS: Record<string, { label: string, variant: BadgeVariant }> = {
  Pending: { label: 'Menunggu', variant: 'secondary' },
  Active: { label: 'Aktif', variant: 'default' },
  Inactive: { label: 'Nonaktif', variant: 'outline' },
  Rejected: { label: 'Ditolak', variant: 'destructive' },
}

export function accountStatus(status: string) {
  return ACCOUNT_STATUS[status] ?? { label: status, variant: 'outline' as BadgeVariant }
}
