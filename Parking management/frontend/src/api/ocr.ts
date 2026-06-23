import { apiRequest } from './client';

export interface PlateOcrResponse {
  success: boolean;
  plate_number: string | null;
  raw_text: string;
  confidence: number;
  message: string | null;
}

export function detectPlate(file: File): Promise<PlateOcrResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<PlateOcrResponse>('/ocr/plate', {
    method: 'POST',
    body: formData,
  });
}
