
import DOMPurify from 'dompurify';

// File size limit: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Row limit for CSV processing
export const MAX_CSV_ROWS = 50000;

// Column limit for CSV files
export const MAX_CSV_COLUMNS = 20;

// Coordinate validation bounds for Spain
export const SPAIN_BOUNDS = {
  lat: { min: 27.6, max: 43.8 },
  lng: { min: -18.2, max: 4.3 }
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * Validate coordinate values
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= SPAIN_BOUNDS.lat.min &&
    lat <= SPAIN_BOUNDS.lat.max &&
    lng >= SPAIN_BOUNDS.lng.min &&
    lng <= SPAIN_BOUNDS.lng.max
  );
};

/**
 * Sanitize and validate numeric input
 */
export const sanitizeNumber = (value: unknown): number => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  // Prevent extremely large numbers that could cause issues
  return Math.max(-1e12, Math.min(1e12, num));
};

/**
 * Sanitize string input
 */
export const sanitizeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  // Limit string length and sanitize
  const trimmed = value.trim().substring(0, 200);
  return sanitizeHtml(trimmed);
};
