import {
  createDefaultPagination,
  listUrl,
  request,
  type PaginatedApiResponse,
  type PaginatedPage,
  type PaginationMeta,
} from "@/lib/http";

export type SurveyStatus =
  "Pending" | "OnComplain" | "OnVerification" | "OnBudgeting" | "Completed";
export type SurveyAuthority =
  "Pusat" | "Provinsi" | "KabupatenKota" | "MasyarakatSwasta";
export type DamageLevel = "Ringan" | "Sedang" | "Berat" | "TMK";
export type SortOrder = "asc" | "desc";

export interface ProvinceReference {
  id: string;
  name: string;
}

export interface RegencyReference {
  id: string;
  provinceId: string;
  name: string;
}

export interface DistrictReference {
  id: string;
  regencyId: string;
  name: string;
}

export interface VillageReference {
  id: string;
  districtId: string;
  name: string;
}

export interface SurveyItem {
  surveyId: number;
  disasterId: number;
  sectorId: number;
  surveyStatus: SurveyStatus | string;
  provinceId?: string | null;
  regencyId?: string | null;
  districtId?: string | null;
  villageId?: string | null;
  addressDetail: string;
  authority: SurveyAuthority | string;
  assetName: string;
  nik: string;
  latitude: string;
  longitude: string;
  damageLevel: DamageLevel | string;
  volume: string;
  volumeUnit: string;
  totalPriceUnit: string;
  totalPriceFurniture: string;
  totalScore: string;
  sourceOfBudgetting?: string | null;
  createdAt: string;
  updatedAt: string;
  province?: ProvinceReference | null;
  regency?: RegencyReference | null;
  district?: DistrictReference | null;
  village?: VillageReference | null;
  files?: SurveyFileCategoryPayload[];
}

export type SurveyListItem = SurveyItem;

export interface SurveyQuery extends Record<string, unknown> {
  page: number;
  limit: number;
  disasterId?: number;
  sectorId?: number;
  surveyStatus?: SurveyStatus | string;
  damageLevel?: DamageLevel | string;
  assetName?: string;
  nik?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export type { PaginationMeta, PaginatedApiResponse, PaginatedPage };

// Specific aliases for Survey domain
export type SurveyPaginationMeta = PaginationMeta;
export type SurveyApiResponse = PaginatedApiResponse<SurveyListItem>;
export type SurveyPage = PaginatedPage<SurveyListItem>;

export interface SurveyFurnitureDetailPayload {
  furnitureName: string;
  damageCategory: DamageLevel | string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface SurveyHousingDetailPayload {
  housingDamageAssessmentId: number;
  totalUnit: number;
  score: number;
}

export interface SurveyLostDetailPayload {
  lossAssessmentId: number;
  totalUnit: number;
  unitPrice: number;
  duration: number;
  durationUnit: string;
  description?: string;
  typeOfLoss: string;
}

export interface SurveyFileItemPayload {
  filePath: string;
  fileName: string;
}

export interface SurveyFileCategoryPayload {
  category: string;
  file: SurveyFileItemPayload[];
}

export interface CreateSurveyPayload {
  disasterId: number;
  sectorId: number;
  surveyorId?: number;
  surveyStatus?: SurveyStatus | string;
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
  addressDetail: string;
  authority: SurveyAuthority | string;
  assetName: string;
  nik: string;
  latitude: string;
  longitude: string;
  damageLevel?: DamageLevel | string;
  volume: string;
  volumeUnit: string;
  totalPriceUnit?: number;
  totalPriceFurniture?: number;
  totalScore?: string | number;
  sourceOfBudgetting?: string | null;
  furnitureDetails?: SurveyFurnitureDetailPayload[];
  housingDetails?: SurveyHousingDetailPayload[];
  lostDetails?: SurveyLostDetailPayload[];
  surveyFolderPath?: string;
  files?: SurveyFileCategoryPayload[];
}

export type UpdateSurveyPayload = Partial<CreateSurveyPayload>;

export interface UpdateSurveyStatusPayload {
  surveyStatus: SurveyStatus | string;
  sourceOfBudgetting?: string | null;
}

export interface UpdateSurveyComplainPayload {
  complainDescription: string;
  imagesPath?: string[];
}

export async function fetchSurveys(query: SurveyQuery): Promise<SurveyPage> {
  const result = await request<any>(listUrl("/api/surveys", query));

  const items: SurveyListItem[] =
    [result?.data?.data, result?.data, result?.items, result].find(
      Array.isArray,
    ) ?? [];

  const pagination: PaginationMeta =
    result?.pagination ??
    result?.data?.pagination ??
    createDefaultPagination(items.length, query);

  return {
    items,
    total: pagination.total ?? result?.total ?? items.length,
    pagination,
  };
}

export function fetchSurvey(id: number) {
  return request<SurveyItem>(`/api/surveys/${id}`);
}

export function createSurvey(payload: CreateSurveyPayload) {
  return request<SurveyItem>("/api/surveys", {
    method: "POST",
    body: payload,
  });
}

export function updateSurvey(id: number, payload: UpdateSurveyPayload) {
  return request<SurveyItem>(`/api/surveys/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteSurvey(id: number) {
  return request<unknown>(`/api/surveys/${id}`, { method: "DELETE" });
}

export function updateSurveyStatus(
  id: number,
  payload: UpdateSurveyStatusPayload,
) {
  return request<SurveyItem>(`/api/surveys/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export function complainSurvey(
  id: number,
  payload: UpdateSurveyComplainPayload,
) {
  return request<SurveyItem>(`/api/surveys/${id}/complain`, {
    method: "PATCH",
    body: payload,
  });
}
