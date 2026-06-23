import { ApiError } from '../api/client';

export type ReportsSectionKey = 'revenue' | 'traffic' | 'occupancy';

export type ReportsSectionErrors = Partial<Record<ReportsSectionKey, string>>;

export function reportErrorMessage(error: unknown, section: ReportsSectionKey): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to view this report section.';
    }
    if (error.status === 400) {
      return error.message || 'Invalid report filters. Adjust the date range or vehicle type.';
    }
    if (error.status === 404) {
      return 'Report endpoint not found. Check that the backend is up to date.';
    }
    if (!error.status || error.status >= 500) {
      return 'Server error loading this section. Try again in a moment.';
    }
    return error.message || `Could not load ${section} data.`;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Cannot reach the server. Check your connection and that the backend is running.';
  }

  return `Could not load ${section} data. Try again.`;
}

export function overallReportsErrorMessage(errors: ReportsSectionErrors): string {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) {
    return 'Unable to load report data. Try again or choose a different range.';
  }
  const unique = [...new Set(messages)];
  if (unique.length === 1) {
    return unique[0];
  }
  return 'Report data could not be loaded. Check your connection, permissions, and filters.';
}

export function exportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `PDF export failed: ${error.message}`;
  }
  return 'PDF export failed. Try again or use a smaller date range.';
}
