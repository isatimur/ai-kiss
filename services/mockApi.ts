import { AppStatus, JobResult, PresetType } from '../types';

// Simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple in-memory store to track job presets for the demo
const jobStore = new Map<string, PresetType>();

// Mock uploading a file to Supabase Storage
// In production, this would use resumable uploads (TUS)
export const mockUploadFile = async (
  file: File, 
  onProgress: (percent: number) => void
): Promise<string> => {
  const totalSteps = 10;
  for (let i = 1; i <= totalSteps; i++) {
    await delay(150 + Math.random() * 200); // Random network jitter
    onProgress(i * 10);
  }
  return `path/to/bucket/${file.name}-${Date.now()}`;
};

// Mock calling the 'create_job' Edge Function
export const mockCreateJob = async (
  pathA: string, 
  pathB: string, 
  preset: PresetType
): Promise<string> => {
  await delay(800);
  // Returns a fake UUID
  const jobId = `job-${Math.random().toString(36).substr(2, 9)}`;
  jobStore.set(jobId, preset);
  return jobId;
};

// Mock polling the 'job_status' Edge Function
// Simulates the backend worker stages: Validated -> Pre-processing -> Synthesis -> Encoding
export const mockPollJobStatus = async (jobId: string, currentProgress: number): Promise<JobResult> => {
  await delay(1000); // Polling interval simulation

  let nextProgress = currentProgress;
  let status = AppStatus.PROCESSING;

  // Logic to simulate non-linear progress based on PRD
  if (currentProgress < 10) {
    nextProgress = 10; // Validated
  } else if (currentProgress < 25) {
    nextProgress = 25; // Pre-processing
  } else if (currentProgress < 70) {
    nextProgress = currentProgress + 5; // Video synthesis (slowest part)
  } else if (currentProgress < 90) {
    nextProgress = 90; // Encoding
  } else {
    // Finish
    const preset = jobStore.get(jobId) || PresetType.WARM_HUG;
    
    // Select video based on preset
    let videoUrl = 'https://cdn.pixabay.com/video/2022/11/27/140726-775699477_large.mp4'; // Default couple
    
    if (preset === PresetType.COFFEE_DATE) {
       // Steaming french press / coffee pouring video
       videoUrl = 'https://cdn.pixabay.com/video/2020/05/25/40149-424930030_large.mp4';
    }

    return {
      jobId,
      status: AppStatus.SUCCESS,
      progress: 100,
      videoUrl, 
    };
  }

  // Random error simulation (very low probability for demo stability)
  if (Math.random() > 0.99) {
    return {
      jobId,
      status: AppStatus.ERROR,
      progress: currentProgress,
      error: 'AI synthesis failed due to complexity. Please try different photos.',
    };
  }

  return {
    jobId,
    status,
    progress: nextProgress,
  };
};