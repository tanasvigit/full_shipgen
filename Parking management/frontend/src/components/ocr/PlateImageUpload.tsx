import { useCallback, useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';

import { ApiError } from '../../api/client';
import { detectPlate, type PlateOcrResponse } from '../../api/ocr';
import FormField from '../ui/FormField';
import PrimaryButton from '../ui/PrimaryButton';

type UploadState = 'idle' | 'loading' | 'success' | 'error';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface PlateImageUploadProps {
  onDetected: (plateNumber: string) => void;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not process the image.';
}

export default function PlateImageUpload({ onDetected }: PlateImageUploadProps) {
  const inputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [result, setResult] = useState<PlateOcrResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);

  useEffect(() => {
    if (!previewUrl) {
      return undefined;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setResult(null);

    if (file && !ALLOWED_IMAGE_TYPES.has(file.type)) {
      setSelectedFile(null);
      setErrorMessage('Please choose a JPEG, PNG, or WebP image.');
      setUploadState('error');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setUploadState('idle');
  }, []);

  const handleScanClick = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    setUploadState('loading');
    setErrorMessage('');
    setResult(null);

    try {
      const response = await detectPlate(selectedFile);
      setResult(response);

      if (response.success && response.plate_number) {
        setUploadState('success');
        onDetected(response.plate_number);
        return;
      }

      setUploadState('error');
      setErrorMessage(response.message ?? 'No plate number could be detected.');
    } catch (error) {
      setUploadState('error');
      setErrorMessage(toErrorMessage(error));
    }
  }, [onDetected, selectedFile]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-slate-800">Upload Vehicle Image</h4>
        <p className="text-xs text-slate-500">
          Upload a clear vehicle image. The detected number plate will fill the vehicle number field.
        </p>
      </div>

      <div className="space-y-3">
        <FormField label="Vehicle Image" htmlFor={inputId}>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
          />
        </FormField>

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
            <img src={previewUrl} alt="Vehicle preview" className="h-40 w-full object-contain" />
          </div>
        )}

        <PrimaryButton type="button" disabled={!selectedFile || uploadState === 'loading'} onClick={handleScanClick}>
          {uploadState === 'loading' ? 'Scanning Plate...' : 'Detect Plate Number'}
        </PrimaryButton>
      </div>

      {uploadState === 'loading' && <p className="text-sm text-slate-500">Uploading image and reading plate text...</p>}

      {uploadState === 'success' && result?.plate_number && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Detected Plate</p>
          <p className="mt-1 font-mono text-lg text-emerald-900">{result.plate_number}</p>
          <p className="mt-1 text-xs text-emerald-700">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
        </div>
      )}

      {uploadState === 'error' && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      {result?.raw_text && uploadState !== 'loading' && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer text-slate-600">View raw OCR text</summary>
          <p className="mt-2 break-all font-mono">{result.raw_text}</p>
        </details>
      )}
    </div>
  );
}
