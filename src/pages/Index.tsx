
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import MapVisualization from '../components/MapVisualization';
import DataUpload from '../components/DataUpload';
import FilterPanel from '../components/FilterPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import type { CO2Data } from '../components/DataUpload';
import type { FilterState } from '../components/FilterPanel';
import { useTranslation } from '../hooks/useTranslation';
import { sanitizeNumber, sanitizeString, validateCoordinates } from '../utils/security';

const parseCSV = (csvText: string): CO2Data[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => sanitizeString(h.replace(/"/g, '')));
  const records: CO2Data[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue;

      const row: Record<string, string | number | undefined> = {};

      headers.forEach((header, idx) => {
        const value = values[idx];
        row[header] = isNaN(Number(value)) || value === '' ? sanitizeString(value) : sanitizeNumber(value);
      });

      const lat = row.lat ? sanitizeNumber(row.lat) : undefined;
      const lng = row.lng ? sanitizeNumber(row.lng) : undefined;
      
      const coordinates: [number, number] | undefined = 
        lat !== undefined && lng !== undefined && validateCoordinates(lat, lng)
          ? [lat, lng]
          : undefined;

      const standard: CO2Data = {
        region: sanitizeString(row.region || row.Region || row.autonomous_community || row.comunidad_autonoma || ''),
        year: sanitizeNumber(row.year || row.Year || row.año || 0),
        sector: sanitizeString(row.sector || row.Sector || row.industry || row.industria || ''),
        emissions: sanitizeNumber(row.emissions || row.Emissions || row.emisiones || row.co2 || row.CO2 || 0),
        coordinates,
        ...row,
      };

      // Validate data before adding
      if (standard.region && 
          standard.year >= 1900 && 
          standard.year <= 2100 && 
          standard.emissions >= 0 && 
          isFinite(standard.emissions)) {
        records.push(standard);
      }
    } catch (error) {
      console.warn(`Skipping invalid row ${i}:`, error);
      continue;
    }
  }
  return records;
};

const Index = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<CO2Data[]>([]);
  const [filters, setFilters] = useState<FilterState>({ region: null, year: null, sector: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDataLoaded = (loadedData: CO2Data[]) => {
    setData(loadedData);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    const loadData = async () => {
      const url = `${import.meta.env.BASE_URL}climatetrace_aggregated.csv`;
      console.info(`Fetching default data from ${url}`);
      setError(null);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          const msg = `Failed to load data: ${res.status} ${res.statusText}`;
          console.error(msg);
          throw new Error(msg);
        }

        const text = await res.text();

        let parsedData: CO2Data[];
        try {
          parsedData = parseCSV(text);
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          console.error('CSV parse error:', msg);
          throw parseErr;
        }

        setData(parsedData);
        console.log(`Loaded ${parsedData.length} records from default CSV`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Error loading CSV:', msg);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    };

    loadData().catch(err => console.error('loadData failed:', err));
  }, []);

  const availableRegions = Array.from(new Set(data.map(d => d.region))).sort();
  const availableYears = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
  const availableSectors = Array.from(new Set(data.map(d => d.sector))).sort();

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 space-y-4">
          <DataUpload onDataLoaded={handleDataLoaded} />
          <FilterPanel
            onFiltersChange={handleFiltersChange}
            availableRegions={availableRegions}
            availableYears={availableYears}
            availableSectors={availableSectors}
          />
          <MapVisualization
            data={data}
            filters={filters}
            isLoading={isLoading}
            error={error}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
