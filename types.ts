export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum PresetType {
  WARM_HUG = 'warm_hug',
  SWEET_MOMENT = 'sweet_moment',
  COFFEE_DATE = 'coffee_date',
}

export interface ProcessingStep {
  label: string;
  percent: number;
}

export interface JobResult {
  jobId: string;
  status: AppStatus;
  progress: number;
  videoUrl?: string;
  error?: string;
}

export type UploadProgress = {
  [key: string]: number; // 'fileA' | 'fileB' -> percentage 0-100
};

export interface FileData {
  file: File;
  previewUrl: string;
}