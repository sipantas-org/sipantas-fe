import { request } from "@/lib/http";

export interface UploadPayload {
  filePath: string;
  fileName?: string;
  file: File;
}

export interface UploadResponse {
  filePath: string;
  fileName: string;
  url?: string;
  size?: number;
  mimetype?: string;
  [key: string]: unknown;
}

export const FILE_PATH_REGEX = /^[a-zA-Z0-9 _\/\-]+$/;
export const FILE_NAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

/**
 * Memvalidasi payload upload sebelum dikirimkan ke server.
 * Melemparkan Error jika parameter tidak valid.
 */
export function validateUploadPayload(payload: UploadPayload): void {
  if (!payload.filePath || !payload.filePath.trim()) {
    throw new Error("filePath wajib diisi.");
  }

  if (!FILE_PATH_REGEX.test(payload.filePath.trim())) {
    throw new Error(
      "Nama folder hanya boleh mengandung karakter alfanumerik, spasi, tanda minus (-), garis bawah (_), dan garis miring (/).",
    );
  }

  if (payload.fileName && payload.fileName.trim().length > 0) {
    if (!FILE_NAME_REGEX.test(payload.fileName.trim())) {
      throw new Error(
        "Nama File hanya boleh mengandung karakter alfanumerik, spasi, tanda minus (-), dan garis bawah (_).",
      );
    }
  }

  if (!payload.file) {
    throw new Error("File biner wajib disertakan untuk diunggah.");
  }
}

/**
 * Mengunggah file ke endpoint API dengan multipart/form-data menggunakan utilitas request terpusat.
 */
export function uploadFile(
  payload: UploadPayload,
  uploadUrl = "/api/upload-blob",
): Promise<UploadResponse> {
  validateUploadPayload(payload);

  const formData = new FormData();
  formData.append("filePath", payload.filePath.trim());
  if (payload.fileName && payload.fileName.trim().length > 0) {
    formData.append("fileName", payload.fileName.trim());
  }
  formData.append("file", payload.file);

  return request<UploadResponse>(uploadUrl, {
    method: "POST",
    body: formData,
  });
}
