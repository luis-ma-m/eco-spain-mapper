// components/MapVisualization.tsx
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';

import type { CO2Data } from './DataUpload';
import type { FilterState } from './FilterPanel';

// Fallback coordinates for Spanish autonomous communities
const REGION_COORDS: Record<string, [number, number]> = {
  'Andalucía': [37.7749, -4.7324],
  'Aragón': [41.5868, -0.8296],
  'Asturias': [43.3619, -5.8494],
  'Baleares': [39.6953, 3.0176],
  'Canarias': [28.2916, -16.6291],
  'Cantabria': [43.1828, -3.9878],
  'Castilla-La Mancha': [39.5663, -2.9908],
  'Castilla y León': [41.6523, -4.7245],
  'Cataluña': [41.8019, 1.8734],
  'Comunidad Valenciana': [39.484, -0.7532],
  'Extremadura': [39.1622, -6.3432],
  'Galicia': [42.5751, -8.1339],
  'Madrid': [40.4165, -3.7026],
  'Murcia': [37.9922, -1.1307],
  'Navarra': [42.6954, -1.6761],
  'País Vasco': [43.263, -2.934],
  'La Rioja': [42.2871, -2.5396],
  'España': [40.4168, -3.7038]
};

interface MapVisualizationProps {
  data: CO2Data[];
  filters: FilterState;
  selectedMetrics: string[];
  availableMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  isLoading: boolean;
  error: string | null;
  statusMessage: string;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  data,
  filters,
  selectedMetrics,
  availableMetrics,
  onMetricsChange,
  isLoading,
  error,
  statusMessage,
}) => {
  const { t } = useTranslation();

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.region && item.region !== filters.region) return false;
      if (filters.year && item.year !== filters.year) return false;
      if (filters.sector && item.sector !== filters.sector) return false;
      return true;
    });
  }, [data, filters]);

  // Aggregate data by region/coordinates
  const aggregatedData = useMemo(() => {
    const map = new Map<string, CO2Data & { count: number }>();
    filteredData.forEach(item => {
      const coords = item.coordinates ?? REGION_COORDS[item.region];
      const key = coords ? `${coords[0]},${coords[1]}` : item.region;
      if (map.has(key)) {
        const existing = map.get(key)!;
        selectedMetrics.forEach(metric => {
          const raw = item[metric];
          if (typeof raw === 'number' && typeof existing[metric] === 'number') {
            existing[metric] = (existing[metric] as number) + raw;
          }
        });
        existing.count++;
      } else {
        map.set(key, { ...item, coordinates: coords, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [filteredData, selectedMetrics]);

  // Compute min/max per metric for color/size scales
  const metricRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    selectedMetrics.forEach(metric => {
      const vals = aggregatedData
        .map(item => item[metric] as number)
        .filter(v => typeof v === 'number' && isFinite(v));
      if (vals.length) {
        ranges[metric] = { min: Math.min(...vals), max: Math.max(...vals) };
      }
    });
    return ranges;
  }, [aggregatedData, selectedMetrics]);

  const getMarkerColor = (item: CO2Data, metric: string): string => {
    const val = item[metric] as number;
    const range = metricRanges[metric];
    if (!range || !isFinite(val)) return '#6b7280'; // gray
    const norm = (val - range.min) / (range.max - range.min);
    if (norm > 0.7) return '#dc2626';
    if (norm > 0.4) return '#f59e0b';
    return '#16a34a';
  };

  const getMarkerSize = (item: CO2Data, metric: string): number => {
    const val = item[metric] as number;
    const range = metricRanges[metric];
    if (!range || !isFinite(val)) return 5;
    const norm = (val - range.min) / (range.max - range.min);
    return Math.max(5, Math.min(20, 5 + norm * 15));
  };

  // Default view center
  const centerCoords: LatLngExpression = [40.4168, -3.7038];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">{t('data.loading')}</p>
          {statusMessage && (
            <p className="text-sm text-gray-500 mt-2">{statusMessage}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-2">{t('data.error')}</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* Controls Panel */}
      <Card className="absolute top-4 left-4 z-[1000] w-80 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MapPin className="h-5 w-5 text-green-600" />
            <span>{t('map.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metric Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('map.selectMetrics')}
            </label>
            <Select
              value={selectedMetrics[0] || ''}
              onValueChange={value => onMetricsChange([value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric…" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {availableMetrics.map(metric => (
                  <SelectItem key={metric} value={metric}>
                    {metric}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {t('map.legend')}
            </h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-600" />
                <span className="text-xs text-gray-600">{t('map.high')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="text-xs text-gray-600">{t('map.medium')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-600" />
                <span className="text-xs text-gray-600">{t('map.low')}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('map.total')}:</span>
              <Badge variant="secondary">
                {aggregatedData.length} regions
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <MapContainer
        center={centerCoords}
        zoom={6}
        zoomControl={false}
        className="w-full h-full"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {selectedMetrics.length > 0 &&
          aggregatedData.map((item, idx) => {
            const coords =
              item.coordinates ??
              REGION_COORDS[item.region] ?? [
                centerCoords[0] + Math.random() * 0.1 - 0.05,
                centerCoords[1] + Math.random() * 0.1 - 0.05,
              ];
            const metric = selectedMetrics[0];
            return (
              <CircleMarker
                key={`${item.region}-${idx}`}
                center={coords as LatLngExpression}
                radius={getMarkerSize(item, metric)}
                pathOptions={{
                  fillColor: getMarkerColor(item, metric),
                  color: 'white',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.region}
                    </h3>
                    {selectedMetrics.map(m => (
                      <div key={m} className="text-sm text-gray-600">
                        <span className="font-medium">{m}:</span>{' '}
                        {typeof item[m] === 'number'
                          ? (item[m] as number).toLocaleString()
                          : 'N/A'}{' '}
                        {t('map.unit')}
                      </div>
                    ))}
                    {item.sector && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Sector:</span> {item.sector}
                      </div>
                    )}
                    {item.year && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Year:</span> {item.year}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Status Message */}
      {statusMessage && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Badge variant="outline" className="bg-white/95 backdrop-blur-sm">
            {statusMessage}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
