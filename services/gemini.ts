import { GoogleGenAI, VideoGenerationReferenceType, VideoGenerationReferenceImage } from "@google/genai";
import { PresetType } from '../types';

// Helper to convert File to Base64 (raw string without data URI prefix)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const getPromptForPreset = (preset: PresetType): string => {
  switch (preset) {
    case PresetType.WARM_HUG:
      return "A cinematic, heartwarming video of these two characters sharing a gentle, warm hug in a softly lit environment. High quality, photorealistic, emotional connection.";
    case PresetType.SWEET_MOMENT:
      return "A romantic video of these two characters smiling at each other, sharing a sweet intimate moment, soft lighting, 4k, dreamlike atmosphere.";
    case PresetType.COFFEE_DATE:
      return "A hot video of these two characters doing french kiss soft lighting, 4k, dreamlike atmosphere.";
    default:
      return "A romantic video of these two characters together.";
  }
};

export const generateRomanticVideo = async (
  fileA: File,
  fileB: File,
  preset: PresetType
): Promise<string> => {
  // Ensure we use the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Prepare images
  const base64A = await fileToBase64(fileA);
  const base64B = await fileToBase64(fileB);

  const referenceImages: VideoGenerationReferenceImage[] = [
    {
      image: { imageBytes: base64A, mimeType: fileA.type },
      referenceType: VideoGenerationReferenceType.ASSET
    },
    {
      image: { imageBytes: base64B, mimeType: fileB.type },
      referenceType: VideoGenerationReferenceType.ASSET
    }
  ];

  // 2. Call Veo Model
  // Note: 'veo-3.1-generate-preview' is required for multiple reference images
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt: getPromptForPreset(preset),
    config: {
      numberOfVideos: 1,
      referenceImages: referenceImages,
      resolution: '720p',
      aspectRatio: '16:9' 
    }
  });

  // 3. Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  // 4. Retrieve result
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("No video URI returned from Gemini API.");
  }

  // 5. Fetch the actual video content (proxying via fetch to attach key)
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
  }
  
  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};
