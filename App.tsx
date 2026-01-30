import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, Download, RefreshCw, ShieldCheck, AlertCircle, Coffee, KeyRound } from 'lucide-react';
import { AppStatus, FileData, PresetType, UploadProgress } from './types';
import { PhotoUploader } from './components/PhotoUploader';
import { generateRomanticVideo } from './services/gemini';

// Define the interface locally to avoid global conflict
interface AIStudioClient {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

const App: React.FC = () => {
  // State
  const [fileA, setFileA] = useState<FileData | null>(null);
  const [fileB, setFileB] = useState<FileData | null>(null);
  const [preset, setPreset] = useState<PresetType>(PresetType.WARM_HUG);
  const [safetyChecked, setSafetyChecked] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ fileA: 0, fileB: 0 });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Simulation timer ref
  const progressIntervalRef = useRef<number | null>(null);

  // Check API Key on mount
  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // Cast window to any to avoid TypeScript conflicts with existing global declarations
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Assume success after closing dialog to mitigate race conditions
      setHasApiKey(true);
    }
  };

  // Handlers
  const handleFileSelect = (key: 'A' | 'B') => (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const data: FileData = { file, previewUrl };
    if (key === 'A') setFileA(data);
    else setFileB(data);
    setErrorMsg(null);
  };

  const handleClear = (key: 'A' | 'B') => () => {
    if (key === 'A') {
      if (fileA?.previewUrl) URL.revokeObjectURL(fileA.previewUrl);
      setFileA(null);
    } else {
      if (fileB?.previewUrl) URL.revokeObjectURL(fileB.previewUrl);
      setFileB(null);
    }
  };

  const startFakeProgress = () => {
    setProcessingProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    // Veo takes about 30-60s. We simulate progress up to 90%
    progressIntervalRef.current = window.setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) return 90;
        // Slow down as we get higher
        const increment = prev < 50 ? 2 : 0.5;
        return prev + increment;
      });
    }, 500);
  };

  const stopFakeProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleGenerate = async () => {
    if (!fileA || !fileB || !safetyChecked || !hasApiKey) return;

    setStatus(AppStatus.UPLOADING);
    setUploadProgress({ fileA: 0, fileB: 0 });
    setProcessingProgress(0);
    setErrorMsg(null);

    try {
      // 1. Simulate fast "upload" (conversion happens in service, but we show UI feedback)
      setUploadProgress({ fileA: 50, fileB: 50 });
      await new Promise(r => setTimeout(r, 500));
      setUploadProgress({ fileA: 100, fileB: 100 });

      // 2. Start Processing
      setStatus(AppStatus.PROCESSING);
      startFakeProgress();

      // 3. Call Real Gemini API
      const videoUrl = await generateRomanticVideo(fileA.file, fileB.file, preset);
      
      stopFakeProgress();
      setProcessingProgress(100);
      setResultVideoUrl(videoUrl);
      setStatus(AppStatus.SUCCESS);

    } catch (err: any) {
      console.error(err);
      stopFakeProgress();
      
      // Handle key expiry/not found specifically
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("403") || err.message?.includes("401")) {
         setHasApiKey(false);
         setErrorMsg("API Key invalid or expired. Please reconnect.");
      } else {
         setErrorMsg(err.message || "Failed to generate video. Please try again.");
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const resetApp = () => {
    setStatus(AppStatus.IDLE);
    setUploadProgress({ fileA: 0, fileB: 0 });
    setProcessingProgress(0);
    setResultVideoUrl(null);
    setErrorMsg(null);
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (fileA?.previewUrl) URL.revokeObjectURL(fileA.previewUrl);
      if (fileB?.previewUrl) URL.revokeObjectURL(fileB.previewUrl);
      stopFakeProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Render Helpers --

  const getProcessingLabel = (p: number) => {
    if (p < 20) return "Analyzing photos...";
    if (p < 50) return "Imagine the scene...";
    if (p < 80) return "Generating video (this takes ~1 min)...";
    if (p < 95) return "Polishing details...";
    return "Finalizing...";
  };

  const isLocked = status !== AppStatus.IDLE && status !== AppStatus.ERROR;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6">
      
      {/* Header */}
      <header className="mb-8 text-center max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-2 text-brand-600">
          <Heart className="fill-brand-600" size={28} />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">RomanticMoment AI</h1>
        </div>
        <p className="text-slate-500">
          Transform two photos into a romantic video animation using Gemini Veo.
        </p>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Success View */}
        {status === AppStatus.SUCCESS && resultVideoUrl ? (
          <div className="p-6 md:p-8 flex flex-col items-center animate-fade-in">
            {/* Aspect ratio changed to 16:9 for Veo output */}
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md mb-6 relative">
              <video 
                src={resultVideoUrl} 
                autoPlay 
                loop 
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex flex-col w-full gap-3">
              <a 
                href={resultVideoUrl} 
                download="romantic-moment.mp4"
                className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-brand-200"
              >
                <Download size={20} />
                Download Video
              </a>
              <button 
                onClick={resetApp}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3.5 px-6 rounded-xl transition-all"
              >
                <RefreshCw size={18} />
                Generate Another
              </button>
            </div>
          </div>
        ) : (
          /* Input View */
          <div className="p-6 md:p-8 space-y-8">
            
            {/* 1. Upload Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start relative">
              <PhotoUploader 
                label="Person A" 
                fileData={fileA} 
                onFileSelect={handleFileSelect('A')} 
                onClear={handleClear('A')}
                disabled={isLocked}
                uploadProgress={uploadProgress.fileA}
              />
              
              {/* Connector Icon */}
              <div className="hidden md:flex flex-col items-center justify-center h-64 pt-6">
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shadow-sm z-10">
                   <Heart size={16} className="fill-brand-500" />
                </div>
              </div>
              
              <PhotoUploader 
                label="Person B" 
                fileData={fileB} 
                onFileSelect={handleFileSelect('B')} 
                onClear={handleClear('B')}
                disabled={isLocked}
                uploadProgress={uploadProgress.fileB}
              />
            </div>

            {/* 2. Preset Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Choose Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => !isLocked && setPreset(PresetType.WARM_HUG)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all
                    ${preset === PresetType.WARM_HUG 
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' 
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                    ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="block font-semibold text-slate-900 mb-1">Warm Hug</span>
                  <span className="text-xs text-slate-500">Gentle embrace animation</span>
                  {preset === PresetType.WARM_HUG && (
                    <div className="absolute top-3 right-3 text-brand-500">
                      <Sparkles size={16} className="fill-brand-500" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => !isLocked && setPreset(PresetType.SWEET_MOMENT)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all
                    ${preset === PresetType.SWEET_MOMENT 
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' 
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                    ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="block font-semibold text-slate-900 mb-1">Sweet Moment</span>
                  <span className="text-xs text-slate-500">Smiling & looking closer</span>
                  {preset === PresetType.SWEET_MOMENT && (
                    <div className="absolute top-3 right-3 text-brand-500">
                      <Sparkles size={16} className="fill-brand-500" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => !isLocked && setPreset(PresetType.COFFEE_DATE)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all sm:col-span-2
                    ${preset === PresetType.COFFEE_DATE 
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' 
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                    ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="block font-semibold text-slate-900 mb-1">Coffee Date</span>
                      <span className="text-xs text-slate-500">Hot french press vibes</span>
                    </div>
                    {preset === PresetType.COFFEE_DATE ? (
                      <div className="text-brand-500 bg-white p-2 rounded-full shadow-sm">
                        <Coffee size={20} />
                      </div>
                    ) : (
                      <div className="text-slate-400">
                         <Coffee size={20} />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Safety Policy */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className={`flex items-start gap-3 cursor-pointer ${isLocked ? 'pointer-events-none opacity-70' : ''}`}>
                <div className="relative flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    checked={safetyChecked}
                    onChange={(e) => setSafetyChecked(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                  />
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-medium text-slate-700 block mb-0.5 flex items-center gap-1">
                    <ShieldCheck size={12} /> Content Safety Policy
                  </span>
                  I confirm I have the rights to use these photos and consent of the people depicted. 
                  I understand NSFW/explicit content is strictly prohibited and filtered.
                </div>
              </label>
            </div>

            {/* Error Message */}
            {status === AppStatus.ERROR && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Generation Failed</p>
                  <p>{errorMsg || "Something went wrong. Please try again."}</p>
                </div>
              </div>
            )}

            {/* Processing State / Action Buttons */}
            {status === AppStatus.PROCESSING || status === AppStatus.QUEUED || status === AppStatus.UPLOADING ? (
              <div className="space-y-3">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="font-medium text-brand-700 animate-pulse">
                     {getProcessingLabel(processingProgress)}
                   </span>
                   <span className="text-slate-400 font-mono">{Math.floor(processingProgress)}%</span>
                </div>
                <p className="text-xs text-center text-slate-400 mt-2">
                  Please don't close this tab. Video generation runs on the server but requires you to wait for the download link.
                </p>
              </div>
            ) : (
              // Actions
              !hasApiKey ? (
                <button
                  onClick={handleConnectKey}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-slate-800 text-white hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <KeyRound size={20} />
                  Connect Google AI Key
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!fileA || !fileB || !safetyChecked || isLocked}
                  className={`
                    w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg shadow-brand-100
                    flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                    ${!fileA || !fileB || !safetyChecked 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white'}
                  `}
                >
                  <Sparkles size={20} className="fill-white/20" />
                  Generate Animation
                </button>
              )
            )}

            {/* Footer with Billing Info */}
            {!hasApiKey && (
              <p className="text-xs text-center text-slate-400">
                You need a paid API key from a valid Google Cloud Project to use Veo models. <br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-brand-500">
                  Read about billing requirements
                </a>
              </p>
            )}

          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        <p>Your photos are sent directly to Google Gemini AI and are not stored by this app.</p>
        <p className="mt-1 opacity-70">Powered by Gemini Veo 3.1</p>
      </footer>
    </div>
  );
};

export default App;