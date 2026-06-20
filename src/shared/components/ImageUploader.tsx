import React, { useState } from 'react';
import { toast } from '../../shared/ui/Toast';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  currentImage?: string;
  onUpload: (base64: string | undefined) => void;
  label?: string;
  circular?: boolean;
}

export default function ImageUploader({ 
  currentImage, 
  onUpload, 
  label = "Upload Visual Reference", 
  circular = false 
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are permitted.");
      return;
    }

    // Safeguard filesize
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please upload image assets smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onUpload(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-1.5" id="image-uploader-wrapper">
      {label && <span className="block text-[10px] uppercase text-[var(--color-text-muted)] font-mono tracking-wider">{label}</span>}
      
      {currentImage ? (
        <div className="relative group overflow-hidden border border-white/[0.08] bg-[var(--color-background)]/40 rounded flex items-center justify-center p-2 h-28 aspect-video max-w-sm rounded-lg">
          <img 
            src={currentImage} 
            alt="Reference Visual" 
            referrerPolicy="no-referrer"
            className="h-full object-contain rounded max-w-full"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onUpload(undefined)}
              title="Remove Attachment"
              className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
            >
              <X size={14} />
            </button>
            <label className="p-1.5 bg-[#d4af37]/80 hover:bg-[#d4af37] text-black rounded transition-colors cursor-pointer">
              <Camera size={14} />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleChange}
              />
            </label>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`h-24 max-w-sm border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative bg-[var(--color-background)]/20 ${
            isDragOver 
              ? 'border-[#d4af37] bg-[#d4af37]/5' 
              : 'border-white/[0.08] hover:border-white/20'
          }`}
        >
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleChange}
          />
          <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.05] text-[var(--color-text-muted)]">
            <Upload size={14} className="animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-mono text-[var(--color-text-muted)]">Drag swatches or click to browse</p>
            <p className="text-[9px] font-mono text-[var(--color-text-muted)] mt-0.5">JPEG, PNG, WebP up to 2MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
