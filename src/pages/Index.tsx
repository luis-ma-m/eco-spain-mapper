
// pages/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';

import Header from '../components/Header';
import MapVisualization from '../components/MapVisualization';
import DataUpload from '../components/DataUpload';
import FilterPanel from '../components/FilterPanel';
import ErrorBoundary from '../components/ErrorBoundary';

import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
    transform: value => value.trim().replace(/"/g, ''),
  });

  if (errors.length > 0) {
    console.warn('CSV parse errors:', errors);
  }

  return rows.reduce<CO2Data[]>((acc, row, i) => {
    try {
      const sanitizedRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        const cleanKey = sanitizeString(key);
        if (!value) continue;
        if (!isNaN(Number(value))) {
          sanitizedRow[cleanKey] = sanitizeNumber(value);
        } else {
          sanitizedRow[cleanKey] = sanitizeString(value);
        }
      }

      const region = sanitizeString(
        (sanitizedRow.region as string) ||
        (sanitizedRow.Region as string) ||
        (sanitizedRow.autonomous_community as string) ||
        (sanitizedRow.comunidad_autonoma as string) ||
        ''
      );

      const yearRaw = sanitizedRow.year || sanitizedRow.Year || sanitizedRow.año || '';
      const year = sanitizeNumber(yearRaw) || 0;

      const sector = sanitizeString(
        (sanitizedRow.sector as string) ||
        (sanitizedRow.Sector as string) ||
        (sanitizedRow.industry as string) ||
        (sanitizedRow.industria as string) ||
        ''
      );

      const emissionsRaw = 
        sanitizedRow.emissions ||
        sanitizedRow.Emissions ||
        sanitizedRow.emisiones ||
        sanitizedRow.co2 ||
        sanitizedRow.CO2 ||
        '';
      const emissions = sanitizeNumber(emissionsRaw) || 0;

      const lat = sanitizedRow.lat !== undefined ? sanitizeNumber(sanitizedRow.lat) : undefined;
      const lng = sanitizedRow.lng !== undefined ? sanitizeNumber(sanitizedRow.lng) : undefined;
      const coordinates =
        lat !== undefined &&
        lng !== undefined &&
        validateCoordinates(lat, lng)
          ? ([lat, lng] as [number, number])
          : undefined;

      if (
        region &&
        year >= 1900 &&
        year <= 2100 &&
        emissions >= 0 &&
        Number.isFinite(emissions)
      ) {
        const record: CO2Data = { region, year, sector, emissions, coordinates };
        for (const [k, v] of Object.entries(sanitizedRow)) {
          if (
            typeof v === 'number' &&
            !['year', 'lat', 'lng'].includes(k) &&
            !(k in record)
          ) {
            record[k] = v;
          }
        }
        acc.push(record);
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
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = sessionStorage.getItem('filters');
      return saved
        ? (JSON.parse(saved) as FilterState)
        : { region: null, year: null, sector: null };
    } catch {
      return { region: null, year: null, sector: null };
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isDataModalOpen, setDataModalOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selectedMetrics');
      return saved ? JSON.parse(saved) : ['emissions'];
    } catch {
      return ['emissions'];
    }
  });

  const handleDataLoaded = (loadedData: CO2Data[]) => {
    setData(loadedData);
    setStatusMsg(`Loaded ${loadedData.length} records from upload`);
    setDataModalOpen(false);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Persist selection
  useEffect(() => {
    try {
      localStorage.setItem('selectedMetrics', JSON.stringify(selectedMetrics));
    } catch {
      // ignore
    }
  }, [selectedMetrics]);

  useEffect(() => {
    try {
      sessionStorage.setItem('filters', JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  // Load default CSV on mount
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      const dataUrl = `${import.meta.env.BASE_URL}climatetrace_aggregated.csv`;
      setStatusMsg(`Fetching default data from ${dataUrl}`);

      try {
        const res = await fetch(dataUrl, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        let parsedData: CO2Data[];
        try {
          parsedData = parseCSV(text);
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          console.error('CSV parse error:', msg);
          setStatusMsg(`CSV parse error: ${msg}`);
          throw parseErr;
        }
        setData(parsedData);
        const msgLoaded = `Loaded ${parsedData.length} records from default CSV`;
        setStatusMsg(msgLoaded);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Error loading CSV:', msg);
        setError(msg);
        setStatusMsg(`Error loading CSV: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    return () => { controller.abort(); };
  }, []);

  // Memoize filter options
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

  // Discover numeric fields for metrics
  const availableMetrics = useMemo(() => {
    const metrics = new Set<string>();
    data.forEach(record => {
      Object.entries(record).forEach(([k, v]) => {
        if (typeof v === 'number' && isFinite(v) && !['year', 'lat', 'lng'].includes(k)) {
          metrics.add(k);
        }
      });
    });
    return Array.from(metrics).sort();
  }, [data]);

  // Adjust selectedMetrics if needed
  useEffect(() => {
    if (availableMetrics.length === 0) return;
    setSelectedMetrics(prev => {
      const filtered = prev.filter(m => availableMetrics.includes(m));
      return filtered.length > 0 ? filtered : [availableMetrics[0]];
    });
  }, [availableMetrics]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Header onOpenDataModal={() => setDataModalOpen(true)} />

        <main className="relative flex-1">
          <MapVisualization
            data={data}
            filters={filters}
            selectedMetrics={selectedMetrics}
            availableMetrics={availableMetrics}
            onMetricsChange={setSelectedMetrics}
            isLoading={isLoading}
            error={error}
            statusMessage={statusMsg}
            availableRegions={availableRegions}
            availableYears={availableYears}
            availableSectors={availableSectors}
            onFiltersChange={handleFiltersChange}
            onDataLoaded={handleDataLoaded}
          />

          {/* Desktop-only floating buttons */}
          <div className="hidden md:flex absolute bottom-4 right-4 z-[1000] flex-col space-y-2">
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
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  availableRegions={availableRegions}
                  availableYears={availableYears}
                  availableSectors={availableSectors}
                />
              </SheetContent>
            </Sheet>
          </div>
        </main>

        <Dialog open={isDataModalOpen} onOpenChange={setDataModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DataUpload onDataLoaded={handleDataLoaded} />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
