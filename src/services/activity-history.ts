import { listUrl, request, toPage } from "@/lib/http";
import type { SortOrder } from "@/services/master/disaster";

export type ActivityUserType = "Surveyor" | "Administrator" | "Monitoring";

export type ActivitySortBy =
  | "activityId"
  | "userId"
  | "adminId"
  | "relationId"
  | "module"
  | "activity"
  | "createdAt"
  | "name"
  | "userType";

// `module`, `activity` and `name` match part of the text; `userType` is exact.
export interface ActivityHistoryQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  sortBy?: ActivitySortBy;
  sortOrder?: SortOrder;
  module?: string;
  adminId?: number;
  userId?: number;
  activity?: string;
  name?: string;
  userType?: ActivityUserType;
}

export interface ActivityHistoryItem {
  activityId: number;
  userId: number | null;
  adminId: number | null;
  relationId: number | null;
  module: string;
  activity: string;
  // Name and type of whoever acted (surveyor or admin).
  name: string | null;
  userType: ActivityUserType | string | null;
  // "YYYY-MM-DD HH:mm:ss" in Asia/Jakarta time.
  createdAt: string;
}

// Only administrators (not Monitoring accounts) may read this list; the API answers 403 otherwise.
export async function fetchActivityHistoryPage(query: ActivityHistoryQuery) {
  return toPage<ActivityHistoryItem>(
    await request<unknown>(listUrl("/api/activity-history", query)),
  );
}
