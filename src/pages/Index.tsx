import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import MapVisualization from '../components/MapVisualization';
import type { CO2Data } from '../components/DataUpload';
import type { FilterState } from '../components/FilterPanel';
import { useTranslation } from '../hooks/useTranslation';

const parseCSV = (csvText: string): CO2Data[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const records: CO2Data[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) continue;
    const row: Record<string, string | number | undefined> = {};
    headers.forEach((header, idx) => {
      const value = values[idx];
      row[header] = isNaN(Number(value)) || value === '' ? value : Number(value);
    });
    const standard: CO2Data = {
      region: row.region || row.Region || row.autonomous_community || row.comunidad_autonoma || '',
      year: row.year || row.Year || row.año || 0,
      sector: row.sector || row.Sector || row.industry || row.industria || '',
      emissions: row.emissions || row.Emissions || row.emisiones || row.co2 || row.CO2 || 0,
      coordinates: row.lat && row.lng ? [Number(row.lat), Number(row.lng)] : undefined,
      ...row,
    };
    if (standard.region && standard.year && standard.emissions) records.push(standard);
  }
  return records;
};

const Index = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<CO2Data[]>([]);
  const [filters] = useState<FilterState>({ region: null, year: null, sector: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/climatetrace_aggregated.csv');
        if (!res.ok) throw new Error('failed to load data');
        const text = await res.text();
        setData(parseCSV(text));
      } catch (err) {
        console.error('Error loading CSV', err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {data.length > 0 ? (
          <MapVisualization data={data} filters={filters} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            {t('data.loading')}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
