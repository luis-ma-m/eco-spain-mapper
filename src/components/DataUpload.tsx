import React, { useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner-toast';
import { 
  MAX_FILE_SIZE, 
  MAX_CSV_ROWS, 
  MAX_CSV_COLUMNS,
  validateFileSize, 
  validateCoordinates, 
  sanitizeNumber, 
  sanitizeString 
} from '../utils/security';

interface DataUploadProps {
  onDataLoaded: (data: CO2Data[]) => void;
}

export interface CO2Data {
  region: string;
  year: number;
  sector: string;
  emissions: number;
  coordinates?: [number, number];
  [key: string]: unknown;
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataLoaded }) => {
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const parseCSV = useCallback(async (csvText: string): Promise<CO2Data[]> => {
    const lines = csvText.trim().split('\n');
    
    // Enhanced validation
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    if (lines.length > MAX_CSV_ROWS + 1) { // +1 for header
      throw new Error(`CSV file has too many rows. Maximum allowed: ${MAX_CSV_ROWS}`);
    }

    const headers = lines[0].split(',').map(h => sanitizeString(h.replace(/"/g, '')));
    
    if (headers.length > MAX_CSV_COLUMNS) {
      throw new Error(`CSV file has too many columns. Maximum allowed: ${MAX_CSV_COLUMNS}`);
    }

    const data: CO2Data[] = [];
    const batchSize = 1000;

    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
      
      for (const line of batch) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length !== headers.length) continue;

        const row: Record<string, string | number | undefined> = {};

        headers.forEach((header, index) => {
          const value = values[index];
          
          // Sanitize and validate input
          if (!isNaN(Number(value)) && value !== '') {
            row[header] = sanitizeNumber(value);
          } else {
            row[header] = sanitizeString(value);
          }
        });

        // Map to standardized format with validation
        const lat = row.lat ? sanitizeNumber(row.lat) : undefined;
        const lng = row.lng ? sanitizeNumber(row.lng) : undefined;
        
        // Validate coordinates if provided
        const coordinates: [number, number] | undefined = 
          lat !== undefined && lng !== undefined && validateCoordinates(lat, lng)
            ? [lat, lng]
            : undefined;

        const standardRow: CO2Data = {
          region: sanitizeString(row.region || row.Region || row.autonomous_community || row.comunidad_autonoma || ''),
          year: sanitizeNumber(row.year || row.Year || row.año || 0),
          sector: sanitizeString(row.sector || row.Sector || row.industry || row.industria || ''),
          emissions: sanitizeNumber(row.emissions || row.Emissions || row.emisiones || row.co2 || row.CO2 || 0),
          coordinates,
          ...row
        };

        // Only include valid records
        if (standardRow.region && standardRow.year > 1900 && standardRow.year < 2100 && standardRow.emissions >= 0) {
          data.push(standardRow);
        }
      }

      const processedRows = i + batch.length - 1;
      setProcessingProgress(Math.round((processedRows / (lines.length - 1)) * 100));
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return data;
  }, []);

  const loadDefaultData = useCallback(async () => {
    setIsLoading(true);
    setProcessingProgress(0);
    
    try {
      const res = await fetch('/climatetrace_aggregated.csv');
      if (!res.ok) throw new Error('Failed to load default data');
      
      const text = await res.text();
      const parsed = await parseCSV(text);
      
      onDataLoaded(parsed);
      toast.success(
        language === 'es'
          ? `Datos cargados exitosamente: ${parsed.length} registros`
          : `Data loaded successfully: ${parsed.length} records`
      );
    } catch (error) {
      console.error('Error loading default data:', error);
      const errorMessage = error instanceof Error ? error.message : language === 'es' ? 'Error desconocido' : 'Unknown error';
      toast.error(
        language === 'es'
          ? `Error al cargar datos predefinidos: ${errorMessage}`
          : `Error loading default data: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  }, [parseCSV, onDataLoaded]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error(
        language === 'es'
          ? 'Por favor, selecciona un archivo CSV válido'
          : 'Please select a valid CSV file'
      );
      return;
    }

    if (!validateFileSize(file)) {
      toast.error(
        language === 'es'
          ? `El archivo es demasiado grande. Tamaño máximo: ${Math.round(
              MAX_FILE_SIZE / (1024 * 1024)
            )}MB`
          : `File is too large. Max size: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
      );
      return;
    }

    setIsLoading(true);
    setProcessingProgress(0);
    
    try {
      const text = await file.text();
      const parsedData = await parseCSV(text);
      
      if (parsedData.length === 0) {
        throw new Error(
          language === 'es'
            ? 'No se encontraron datos válidos en el archivo CSV'
            : 'No valid data found in the CSV file'
        );
      }

      console.log(`Loaded ${parsedData.length} records from CSV`);
      onDataLoaded(parsedData);
      toast.success(
        language === 'es'
          ? `Datos cargados exitosamente: ${parsedData.length} registros`
          : `Data loaded successfully: ${parsedData.length} records`
      );
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : language === 'es'
          ? 'Error desconocido al procesar CSV'
          : 'Unknown error processing CSV';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
      // Clear the input
      event.target.value = '';
    }
  }, [parseCSV, onDataLoaded]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('upload.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('csv-upload')?.click()}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('upload.processing') : t('upload.button')}
            </Button>
            <Button
              variant="outline"
              onClick={loadDefaultData}
              disabled={isLoading}
              className="w-full mt-2"
            >
              {t('upload.default')}
            </Button>
          </div>

          {isLoading && processingProgress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {t('upload.processing')} {processingProgress}%
              </p>
            </div>
          )}
          
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>{t('upload.instructionsTitle')}</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t('upload.instruction.columns')}</li>
              <li>{t('upload.instruction.optional')}</li>
              <li>{t('upload.instruction.headers')}</li>
              <li>
                {language === 'es'
                  ? `Tamaño máximo: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
                  : `Max size: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`}
              </li>
              <li>
                {language === 'es'
                  ? `Máximo ${MAX_CSV_ROWS.toLocaleString()} filas`
                  : `Maximum ${MAX_CSV_ROWS.toLocaleString()} rows`}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUpload;
