# Product Requirements Document (PRD)
**Product Name:** RomanticMoment AI  
**Version:** 1.0  
**Status:** MVP (Minimum Viable Product)

## 1. Executive Summary
RomanticMoment AI is a single-screen web application that utilizes Google's Gemini Veo 3.1 generative video technology. It allows users to upload two separate photos of individuals and merge them into a cohesive, animated romantic video clip. The application focuses on simplicity, privacy, and ease of use, operating on a "Bring Your Own Key" (BYOK) model for API access.

## 2. Goals & Success Metrics
*   **Primary Goal:** Enable users to generate high-quality, short romantic video clips from static images within 2 minutes.
*   **Success Metrics:**
    *   Successful video generation rate.
    *   User retention (generating more than one video).
    *   Download click-through rate.

## 3. Target Audience
*   Couples looking to create digital mementos.
*   Social media creators (Instagram Reels, TikTok) looking for unique content.
*   Individuals creating digital gifts for partners.

## 4. User Stories
*   **As a user**, I want to upload two separate photos easily so that the AI knows who to animate.
*   **As a user**, I want to choose between different romantic "vibes" (e.g., Hug, Sweet Moment, Coffee Date) to control the output style.
*   **As a user**, I want to see a progress bar so I know the application hasn't frozen during the generation process.
*   **As a user**, I want to download the final video to my device to share it on social media.
*   **As a user**, I want to connect my own Google API key securely to fund the generation.

## 5. Functional Requirements

### 5.1 Image Input
*   **Dual Uploader:** Two distinct drop zones for "Person A" and "Person B".
*   **Validation:**
    *   File types: JPEG, PNG, WEBP.
    *   Max size: 15MB per file.
    *   Client-side validation before processing.
*   **Preview:** Immediate visual feedback of uploaded images with a "Clear/Remove" option.

### 5.2 Style Selection (Presets)
Users must select one of the following prompts to guide the video generation:
1.  **Warm Hug:** "Gentle embrace animation."
    *   *System Prompt:* Cinematic, heartwarming, gentle warm hug, photorealistic.
2.  **Sweet Moment:** "Smiling & looking closer."
    *   *System Prompt:* Smiling at each other, intimate moment, soft lighting, 4k.
3.  **Coffee Date:** "Hot french press vibes."
    *   *System Prompt:* Cozy atmosphere, french press/coffee context, cinematic lighting.

### 5.3 Video Generation Engine
*   **Model:** Google Gemini Veo (`veo-3.1-generate-preview`).
*   **Input Handling:** Convert uploaded images to Base64 strings.
*   **Reference Configuration:** utilize `VideoGenerationReferenceType.ASSET` to pass both images as context.
*   **Output Specs:**
    *   Resolution: 720p.
    *   Aspect Ratio: 16:9 (Landscape).
    *   Format: MP4.

### 5.4 API Key Management
*   **Integration:** Use `window.aistudio` to manage API key selection.
*   **Validation:** Check if a key is selected (`hasSelectedApiKey`).
*   **Error Handling:** Detect 401/403/404 errors related to billing or invalid keys and prompt re-authentication.

### 5.5 UI/UX & State Management
*   **Idle:** Clean interface, uploaders active, "Generate" button disabled until inputs are ready.
*   **Uploading:** Visual feedback for file preparation.
*   **Processing:**
    *   Progress bar simulating steps (Analyzing -> Imagine -> Generating -> Polishing).
    *   Animated text labels to keep user engaged during the ~60s wait time.
    *   Warning text: "Please don't close this tab."
*   **Success:**
    *   Video player with autoplay, loop, and controls.
    *   "Download Video" button.
    *   "Generate Another" button (resets state).
*   **Error:** Clear error message display with suggestions (e.g., "API Key expired").

## 6. Technical Architecture

### 6.1 Stack
*   **Frontend Framework:** React 19 (via ESM/CDN).
*   **Styling:** Tailwind CSS (configured via CDN).
*   **Icons:** Lucide React.
*   **SDK:** `@google/genai` (v1.38.0+).

### 6.2 Data Flow
1.  User selects files -> Browser stores as `File` objects.
2.  User clicks Generate -> Files converted to Base64.
3.  `GoogleGenAI` client initialized with `process.env.API_KEY`.
4.  `ai.models.generateVideos` called with prompt + 2 reference images.
5.  Client polls `ai.operations.getVideosOperation` every 5 seconds until `done: true`.
6.  Video URI fetched via proxy (`fetch` + API Key query param) to retrieve Blob.
7.  Blob converted to ObjectURL for display/download.

## 7. Safety & Compliance
*   **User Consent:** Mandatory checkbox: "I confirm I have the rights... I understand NSFW is prohibited."
*   **Model Safety:** Rely on Gemini Veo's intrinsic safety filters for generated content.
*   **Data Privacy:** No backend storage. Images are sent directly from the client to Google's API and are not persisted by the application layer.

## 8. UI Design System
*   **Theme:** Romantic / Soft.
*   **Colors:**
    *   Primary: Rose/Red (`brand-500`: #f43f5e, `brand-600`: #e11d48).
    *   Background: Slate-50.
*   **Components:** Rounded corners (