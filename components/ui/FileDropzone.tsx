'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadIcon, FilePdfIcon, FileTextIcon, FileWordIcon, FileImageIcon } from './Icons';
import { DOCUMENT_IMPORT_CONFIG, SUPPORTED_FILE_ACCEPT, IMAGE_EXTENSIONS } from '@/lib/constants';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  processingMessage?: string;
  accept?: string;
  maxSizeBytes?: number;
}

export function FileDropzone({
  onFileSelect,
  isProcessing,
  processingMessage,
  accept = SUPPORTED_FILE_ACCEPT,
  maxSizeBytes = DOCUMENT_IMPORT_CONFIG.maxFileSizeBytes,
}: FileDropzoneProps) {
  const t = useTranslations('import');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSizeBytes) {
        const maxMB = maxSizeBytes / (1024 * 1024);
        return t('fileTooLarge', { maxSize: `${maxMB}MB` });
      }

      // Check file type
      const extension = file.name.toLowerCase().split('.').pop();
      const validExtensions = accept.split(',').map((ext) => ext.trim().replace('.', ''));
      if (!extension || !validExtensions.includes(extension)) {
        return t('unsupportedFormat');
      }

      return null;
    },
    [maxSizeBytes, accept, t]
  );

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      return <FilePdfIcon className="w-10 h-10 text-red-400" />;
    }
    if (ext === 'doc' || ext === 'docx') {
      return <FileWordIcon className="w-10 h-10 text-blue-500" />;
    }
    if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext || '')) {
      return <FileImageIcon className="w-10 h-10 text-green-400" />;
    }
    return <FileTextIcon className="w-10 h-10 text-blue-400" />;
  };

  const maxMB = maxSizeBytes / (1024 * 1024);

  return (
    <div className="w-full">
      <label
        className={`
          relative flex flex-col items-center justify-center w-full h-48
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
          ${error ? 'border-red-500/50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300">{processingMessage || t('processing')}</p>
          </div>
        ) : selectedFile && !error ? (
          <div className="flex flex-col items-center gap-3">
            {getFileIcon(selectedFile.name)}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <p className="text-xs text-slate-500">{t('clickToChange')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`p-3 rounded-full ${isDragging ? 'bg-violet-500/20' : 'bg-slate-700/50'}`}
            >
              <UploadIcon
                className={`w-8 h-8 ${isDragging ? 'text-violet-400' : 'text-slate-400'}`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-violet-400">{t('clickToUpload')}</span>
                {' '}{t('orDragAndDrop')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {t('supportedFormats')} ({maxMB}MB max)
              </p>
            </div>
          </div>
        )}
      </label>

      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
