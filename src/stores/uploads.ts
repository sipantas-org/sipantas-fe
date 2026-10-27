import { defineStore } from "pinia";
import {
  uploadFile,
  type UploadPayload,
  type UploadResponse,
} from "@/services/uploads";

export interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  lastUploadedFile: UploadResponse | null;
  error: string | null;
}

export const useUploadStore = defineStore("upload", {
  state: (): UploadState => ({
    isUploading: false,
    uploadProgress: 0,
    lastUploadedFile: null,
    error: null,
  }),

  actions: {
    /**
     * Menjalankan proses upload berkas, mengelola status progres dan penanganan error.
     */
    async upload(payload: UploadPayload): Promise<UploadResponse> {
      this.error = null;
      this.uploadProgress = 0;
      this.isUploading = true;

      try {
        const response = await uploadFile(payload);

        this.lastUploadedFile = response;
        this.uploadProgress = 100;
        return response;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga saat mengunggah berkas.";
        this.error = errorMessage;
        throw err;
      } finally {
        this.isUploading = false;
      }
    },

    /**
     * Mereset seluruh state kembali ke nilai awal.
     */
    resetState(): void {
      this.isUploading = false;
      this.uploadProgress = 0;
      this.lastUploadedFile = null;
      this.error = null;
    },
  },
});
