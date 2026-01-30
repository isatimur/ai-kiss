import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { FileData } from '../types';

interface PhotoUploaderProps {
  label: string;
  fileData: FileData | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  uploadProgress?: number; // 0 to 100
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  label,
  fileData,
  onFileSelect,
  onClear,
  disabled = false,
  uploadProgress = 0,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    // Basic validation per PRD (Client side check)
    if (file.size > 15 * 1024 * 1024) { // 15MB
      alert('File size exceeds 15MB limit.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    onFileSelect(file);
  };

  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  const isFinishedUploading = uploadProgress === 100;

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm font-medium text-slate-700 ml-1">{label}</span>
      
      {!fileData ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center 
            h-48 md:h-64 rounded-xl border-2 border-dashed transition-all duration-200
            ${disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 hover:border-brand-400 hover:bg-brand-50 cursor-pointer'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleChange}
            disabled={disabled}
          />
          <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Upload size={24} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Click or Drop Photo</p>
          <p className="text-xs text-slate-400 mt-1">Max 15MB</p>
        </div>
      ) : (
        <div className="relative h-48 md:h-64 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
          <img
            src={fileData.previewUrl}
            alt="Preview"
            className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
          />
          
          {/* Clear Button */}
          {!disabled && !isUploading && (
            <button
              onClick={onClear}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          )}

          {/* Upload Progress Overlay */}
          {(isUploading || isFinishedUploading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
               {isFinishedUploading ? (
                 <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                    <ImageIcon size={20} />
                 </div>
               ) : (
                 <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="animate-spin h-full w-full text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="absolute text-xs font-bold text-white">{uploadProgress}%</span>
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};