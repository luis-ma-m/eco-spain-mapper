
import React, { useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface DataUploadProps {
  onDataLoaded: (data: CO2Data[]) => void;
}

export interface CO2Data {
  region: string;
  year: number;
  sector: string;
  emissions: number;
  coordinates?: [number, number]; // [lat, lng]
  [key: string]: unknown; // Allow for additional CSV columns
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataLoaded }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const loadDefaultData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/climatetrace_aggregated.csv');
      if (!res.ok) throw new Error('Failed to load default data');
      const text = await res.text();
      const parsed = parseCSV(text);
      onDataLoaded(parsed);
      toast.success(`Datos cargados exitosamente: ${parsed.length} registros`);
    } catch (error) {
      console.error('Error loading default data:', error);
      toast.error('Error al cargar datos predefinidos');
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV, onDataLoaded]);

  const parseCSV = useCallback((csvText: string): CO2Data[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: CO2Data[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue;

const row: Record<string, string | number | undefined> = {};

      headers.forEach((header, index) => {
        const value = values[index];
        
        // Try to parse numbers
        if (!isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else {
          row[header] = value;
        }
      });

      // Map common column names to standardized format
      const standardRow: CO2Data = {
        region: row.region || row.Region || row.autonomous_community || row.comunidad_autonoma || '',
        year: row.year || row.Year || row.año || 0,
        sector: row.sector || row.Sector || row.industry || row.industria || '',
        emissions: row.emissions || row.Emissions || row.emisiones || row.co2 || row.CO2 || 0,
        coordinates: row.lat && row.lng ? [Number(row.lat), Number(row.lng)] : undefined,
        ...row // Keep all original columns
      };

      if (standardRow.region && standardRow.year && standardRow.emissions) {
        data.push(standardRow);
      }
    }

    return data;
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Por favor, selecciona un archivo CSV válido');
      return;
    }

    setIsLoading(true);
    
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      console.log(`Loaded ${parsedData.length} records from CSV`);
      onDataLoaded(parsedData);
      toast.success(`Datos cargados exitosamente: ${parsedData.length} registros`);
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Error al procesar el archivo CSV');
    } finally {
      setIsLoading(false);
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
          
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Formato esperado del CSV:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Columnas: region, year, sector, emissions</li>
              <li>Opcionalmente: lat, lng para coordenadas</li>
              <li>Primera fila debe contener los encabezados</li>
              <li>Formato de ejemplo: "Andalucía,2022,Transporte,1234.56"</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUpload;
