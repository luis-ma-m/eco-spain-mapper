// pages/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';

import Header from '../components/Header';
import MapVisualization from '../components/MapVisualization';
import DataUpload from '../components/DataUpload';
import FilterPanel from '../components/FilterPanel';
import ErrorBoundary from '../components/ErrorBoundary';

import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Upload, Filter as FilterIcon } from 'lucide-react';

import type { CO2Data } from '../components/DataUpload';
import type { FilterState } from '../components/FilterPanel';

import { useTranslation } from '../hooks/useTranslation';
import { sanitizeNumber, sanitizeString, validateCoordinates } from '../utils/security';

const parseCSV = (csvText: string): CO2Data[] => {
  const { data: rows, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => sanitizeString(header.replace(/"/g, '')),
    transform: (value: string) => value.trim().replace(/"/g, ''),
  });

  if (errors.length > 0) {
    console.warn('CSV parse errors:', errors);
  }

  return rows.reduce<CO2Data[]>((acc, row, i) => {
    try {
      // Build and sanitize each field exactly once
      const region = sanitizeString(
        row.region ||
        row.Region ||
        row.autonomous_community ||
        row.comunidad_autonoma ||
        ''
      );

      const yearRaw = row.year || row.Year || row.año || '';
      const year = sanitizeNumber(yearRaw) || 0;

      const sector = sanitizeString(
        row.sector ||
        row.Sector ||
        row.industry ||
        row.industria ||
        ''
      );

      const emissionsRaw = row.emissions || row.Emissions || row.emisiones || row.co2 || row.CO2 || '';
      const emissions = sanitizeNumber(emissionsRaw) || 0;

      // Coordinates (optional)
      const latRaw = row.lat || '';
      const lngRaw = row.lng || '';
      const lat = latRaw ? sanitizeNumber(latRaw) : undefined;
      const lng = lngRaw ? sanitizeNumber(lngRaw) : undefined;
      const coordinates =
        lat !== undefined &&
        lng !== undefined &&
        validateCoordinates(lat, lng)
          ? [lat, lng] as [number, number]
          : undefined;

      // Validate core fields
      if (
        region &&
        year >= 1900 &&
        year <= 2100 &&
        emissions >= 0 &&
        Number.isFinite(emissions)
      ) {
        acc.push({ region, year, sector, emissions, coordinates });
      }
    } catch (err) {
      console.warn(`Skipping row ${i + 2} (CSV line ${i + 2}):`, err);
    }
    return acc;
  }, []);
};

const Index: React.FC = () => {
  const { t } = useTranslation();

  const [data, setData] = useState<CO2Data[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    region: null,
    year: null,
    sector: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleDataLoaded = (loadedData: CO2Data[]) => {
    setData(loadedData);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `${import.meta.env.BASE_URL}climatetrace_aggregated.csv`;
        console.info(`Fetching data from ${url}`);
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        const parsed = parseCSV(text);
        console.log(`Loaded ${parsed.length} records`);
        setData(parsed);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error loading CSV:', err);
          setError(err.message || 'Unknown error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, []);

  // Memoize filter options so we only recompute when `data` changes
  const availableRegions = useMemo(
    () => Array.from(new Set(data.map(d => d.region))).sort(),
    [data]
  );
  const availableYears = useMemo(
    () => Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b),
    [data]
  );
  const availableSectors = useMemo(
    () => Array.from(new Set(data.map(d => d.sector))).sort(),
    [data]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="relative flex-1">
          <MapVisualization
            data={data}
            filters={filters}
            isLoading={isLoading}
            error={error}
          />

          <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:w-96">
                <DataUpload onDataLoaded={handleDataLoaded} />
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon">
                  <FilterIcon className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:w-80">
                <FilterPanel
                  onFiltersChange={handleFiltersChange}
                  availableRegions={availableRegions}
                  availableYears={availableYears}
                  availableSectors={availableSectors}
                />
              </SheetContent>
            </Sheet>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
