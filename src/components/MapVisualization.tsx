// components/MapVisualization.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useTranslation } from '../hooks/useTranslation';
import { humanizeLabel, humanizeValue } from '@/utils/humanize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

import type { CO2Data } from './DataUpload';
import type { FilterState } from './FilterPanel';
import MobileMenuSheet from './MobileMenuSheet';

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
  availableRegions: string[];
  availableYears: number[];
  availableCategories: string[];
  availableValues: string[];
  onFiltersChange: (filters: FilterState) => void;
  onDataLoaded: (data: CO2Data[]) => void;
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
  availableRegions,
  availableYears,
  availableCategories,
  availableValues,
  onFiltersChange,
  onDataLoaded,
}) => {
  const { t } = useTranslation();
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [visibleStatus, setVisibleStatus] = useState(false);
  const [displayStatus, setDisplayStatus] = useState('');

  // Apply filters to data
  const filteredData = useMemo(
    () =>
      data.filter(item => {
        if (filters.region && item.region !== filters.region) return false;
        if (filters.year && item.year !== filters.year) return false;
        if (filters.sectorCategory && item.sectorCategory !== filters.sectorCategory) return false;
        if (filters.sector && item.sector !== filters.sector) return false;
        return true;
      }),
    [data, filters]
  );

  const filteredWithoutSpain = useMemo(
    () => filteredData.filter(item => item.region !== 'España'),
    [filteredData]
  );

  const spainTotal = useMemo(() => {
    const metric = selectedMetrics[0];
    if (!metric) return 0;
    return filteredData
      .filter(item => item.region === 'España')
      .reduce((sum, item) => {
        const v = item[metric];
        return typeof v === 'number' && isFinite(v) ? sum + v : sum;
      }, 0);
  }, [filteredData, selectedMetrics]);

  // Aggregate values per region/coords
  const aggregatedData = useMemo(() => {
    const map = new Map<string, CO2Data & { count: number }>();
    filteredWithoutSpain.forEach(item => {
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
  }, [filteredWithoutSpain, selectedMetrics]);

  // Compute min/max for each selected metric
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

  // Determine marker color based on metric value
  const getMarkerColor = (item: CO2Data, metric: string): string => {
    const val = item[metric] as number;
    const range = metricRanges[metric];
    if (!range || !isFinite(val)) return '#6b7280'; // gray
    const norm = (val - range.min) / (range.max - range.min);
    if (norm > 0.7) return '#dc2626';
    if (norm > 0.4) return '#f59e0b';
    return '#16a34a';
  };

  // Determine marker size based on metric value
  const getMarkerSize = (item: CO2Data, metric: string): number => {
    const val = item[metric] as number;
    const range = metricRanges[metric];
    if (!range || !isFinite(val)) return 5;
    const norm = (val - range.min) / (range.max - range.min);
    return Math.max(5, Math.min(20, 5 + norm * 15));
  };

  // Handle status message visibility with fade-out
  useEffect(() => {
    if (statusMessage) {
      setDisplayStatus(statusMessage);
      setVisibleStatus(true);
      const hideTimer = setTimeout(() => setVisibleStatus(false), 10000);
      const clearTimer = setTimeout(() => setDisplayStatus(''), 11000);
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [statusMessage]);

  // Default map center (Spain)
  const centerCoords: LatLngExpression = [40.4168, -3.7038];

  // Loading state
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

  // Error state
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
      {/* Mobile Menu - Only visible on mobile */}
      <div className="md:hidden absolute top-4 left-4 z-[500]">
        <MobileMenuSheet
          selectedMetrics={selectedMetrics}
          availableMetrics={availableMetrics}
          onMetricsChange={onMetricsChange}
          aggregatedData={aggregatedData}
          spainTotal={spainTotal}
          availableRegions={availableRegions}
          availableYears={availableYears}
          availableCategories={availableCategories}
          availableValues={availableValues}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onDataLoaded={onDataLoaded}
        />
      </div>
      {spainTotal > 0 && (
        <div className="md:hidden absolute top-4 left-16 right-4 z-[500]">
          <Badge variant="outline" className="bg-white/95 backdrop-blur-sm">
            {(() => {
              const hv = humanizeValue(spainTotal, 3);
              return t('map.spainTotal', {
                value: hv.value,
                unit: t(hv.unitKey),
              });
            })()}
          </Badge>
        </div>
      )}

      {/* Desktop Controls Panel - Hidden on mobile */}
      <Card className="hidden md:block absolute top-4 left-4 z-[500] w-80 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>{t('menu.mapControls')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            >
              {isControlsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {!isControlsCollapsed && (
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
                  <SelectValue placeholder={t('map.selectMetricPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white z-[1400]">
                  {availableMetrics.map(metric => (
                    <SelectItem key={metric} value={metric}>
                      {humanizeLabel(metric)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('map.total')}:</span>
                <Badge variant="secondary">
                  {aggregatedData.length} {t('map.regionsLabel')}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Desktop Legend Panel - Hidden on mobile */}
      <Card className="hidden md:block absolute top-4 left-[22rem] z-[500] w-48 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>{t('map.legend')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            >
              {isLegendCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {!isLegendCollapsed && (
          <CardContent>
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
            {spainTotal > 0 && (
              <div className="pt-2 text-xs text-gray-700 border-t mt-2">
                {(() => {
                  const hv = humanizeValue(spainTotal, 3);
                  return t('map.spainTotal', {
                    value: hv.value,
                    unit: t(hv.unitKey),
                  });
                })()}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* The Map */}
      <MapContainer
        center={centerCoords}
        zoom={6}
        zoomControl={false}
        className="w-full h-full"
        scrollWheelZoom={true}
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
                        <span className="font-medium">{humanizeLabel(m)}:</span>{' '}
                        {(() => {
                          if (typeof item[m] !== 'number') return t('map.na');
                          const hv = humanizeValue(item[m] as number);
                          return `${hv.value} ${t(hv.unitKey)}`;
                        })()}
                      </div>
                    ))}
                    {item.sectorCategory && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{t('filters.category')}:</span>{' '}
                        {t(`category.${item.sectorCategory}`)}
                      </div>
                    )}
                    {item.sector && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{t('filters.value')}:</span>{' '}
                        {t(`value.${item.sector}`)}
                      </div>
                    )}
                    {item.year && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{t('filters.year')}:</span> {item.year}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Status Message */}
      {displayStatus && (
        <div
          className={`absolute bottom-4 left-4 z-[1000] transition-opacity duration-1000 ${
            visibleStatus ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Badge variant="outline" className="bg-white/95 backdrop-blur-sm">
            {displayStatus}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
