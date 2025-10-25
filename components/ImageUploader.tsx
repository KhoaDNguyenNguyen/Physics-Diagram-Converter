
import React, { useCallback, useRef } from 'react';
import { UploadIcon } from './icons/Icons';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, previewUrl, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect, disabled]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-grow flex flex-col">
      <div
        className={`relative flex-grow flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors
          ${disabled ? 'cursor-not-allowed bg-base-200' : 'border-base-300 hover:border-brand-primary hover:bg-base-200/50 cursor-pointer'}
          ${previewUrl ? 'border-solid' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          disabled={disabled}
        />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Diagram preview"
            className="max-h-80 w-auto object-contain rounded-md"
          />
        ) : (
          <div className="text-center text-base-content-secondary">
            <UploadIcon />
            <p className="mt-2 font-semibold">Drag & drop an image here</p>
            <p className="text-sm">or click to select a file</p>
            <p className="text-xs mt-2">(PNG, JPG, WEBP up to 4MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
