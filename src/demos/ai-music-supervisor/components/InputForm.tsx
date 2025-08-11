
import React, { useState, useCallback, DragEvent } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CloseIcon } from './icons/CloseIcon';

interface InputFormProps {
  onGenerate: (script: string, imageFile: File | null) => void;
  error: string | null;
}

const InputForm: React.FC<InputFormProps> = ({ onGenerate, error }) => {
  const [script, setScript] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(script, imageFile);
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload */}
          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-slate-300">Image Cover or Scene</label>
            {imagePreview ? (
              <div className="relative group">
                <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover rounded-lg shadow-lg" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remove image"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${isDragging ? 'border-brand-cyan bg-slate-800' : 'border-slate-600 hover:border-slate-500'}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <UploadIcon className="w-12 h-12 mb-3" />
                  <p className="font-semibold">Drag & drop an image</p>
                  <p className="text-sm">or click to browse</p>
                </div>
              </div>
            )}
          </div>
          {/* Script Input */}
          <div className="flex flex-col">
            <label htmlFor="script" className="mb-2 font-semibold text-slate-300">Script or Description</label>
            <textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="e.g., A lone astronaut drifts in space, looking back at a distant Earth. The mood is melancholic yet hopeful..."
              className="w-full flex-grow p-4 bg-slate-800 border border-slate-700 rounded-lg focus:border-brand-cyan transition-all duration-300 placeholder-slate-500 resize-none"
              rows={10}
            ></textarea>
          </div>
        </div>

        {error && (
          <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}

        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={!script && !imageFile}
            className="px-8 py-3 font-bold text-lg rounded-full text-slate-900 bg-gradient-to-r from-brand-cyan to-brand-magenta hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            Generate Music Brief
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
