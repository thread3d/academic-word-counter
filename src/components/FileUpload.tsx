import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const validExtensions = ['.pdf', '.docx', '.txt'];
    
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50/50 scale-[1.02]" 
            : "border-gray-200 hover:border-gray-300 bg-white",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileInput}
          accept=".pdf,.docx,.txt"
          disabled={isLoading}
          id="file-upload"
        />
        
        <div className="bg-blue-100 p-4 rounded-full mb-6">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isLoading ? "Processing file..." : "Upload your document"}
        </h3>
        <p className="text-gray-500 text-center max-w-sm">
          Drag and drop your PDF, DOCX, or TXT file here, or click to browse.
        </p>
        
        <div className="mt-8 flex gap-4 text-xs font-medium text-gray-400 uppercase tracking-widest">
          <span>PDF</span>
          <span>•</span>
          <span>DOCX</span>
          <span>•</span>
          <span>TXT</span>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl backdrop-blur-[1px]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-600 font-medium">Analyzing text...</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
