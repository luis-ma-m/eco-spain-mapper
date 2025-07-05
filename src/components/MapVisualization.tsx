
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';

import type { CO2Data } from './DataUpload';
import type { FilterState } from './FilterPanel';

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

  // Aggregate data by region and coordinates
  const aggregatedData = useMemo(() => {
    const aggregated = new Map<string, CO2Data & { count: number }>();

    filteredData.forEach(item => {
      const key = item.coordinates ? `${item.coordinates[0]},${item.coordinates[1]}` : item.region;
      
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        selectedMetrics.forEach(metric => {
          if (typeof item[metric] === 'number' && typeof existing[metric] === 'number') {
            existing[metric] = (existing[metric] as number) + (item[metric] as number);
          }
        });
        existing.count++;
      } else {
        const newItem: CO2Data & { count: number } = { ...item, count: 1 };
        aggregated.set(key, newItem);
      }
    });

    return Array.from(aggregated.values());
  }, [filteredData, selectedMetrics]);

  // Calculate metric ranges for color scaling
  const metricRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    
    selectedMetrics.forEach(metric => {
      const values = aggregatedData
        .map(item => item[metric] as number)
        .filter(val => typeof val === 'number' && isFinite(val));
      
      if (values.length > 0) {
        ranges[metric] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });
    
    return ranges;
  }, [aggregatedData, selectedMetrics]);

  // Get color based on metric value
  const getMarkerColor = (item: CO2Data, metric: string): string => {
    const value = item[metric] as number;
    const range = metricRanges[metric];
    
    if (!range || !isFinite(value)) return '#6b7280'; // gray for invalid data
    
    const normalized = (value - range.min) / (range.max - range.min);
    
    if (normalized > 0.7) return '#dc2626'; // red for high
    if (normalized > 0.4) return '#f59e0b'; // orange for medium
    return '#16a34a'; // green for low
  };

  // Get marker size based on metric value
  const getMarkerSize = (item: CO2Data, metric: string): number => {
    const value = item[metric] as number;
    const range = metricRanges[metric];
    
    if (!range || !isFinite(value)) return 5;
    
    const normalized = (value - range.min) / (range.max - range.min);
    return Math.max(5, Math.min(20, 5 + normalized * 15));
  };

  // Default center coordinates for Spain
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
    <div className="w-full h-full relative">
      {/* Controls Panel */}
      <Card className="absolute top-4 left-4 z-10 w-80 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MapPin className="h-5 w-5 text-green-600" />
            <span>{t('map.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metrics Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('map.selectMetrics')}
            </label>
            <Select
              value={selectedMetrics[0] || ''}
              onValueChange={(value) => onMetricsChange([value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric..." />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {availableMetrics.map((metric) => (
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
                <div className="w-4 h-4 rounded-full bg-red-600"></div>
                <span className="text-xs text-gray-600">{t('map.high')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-600">{t('map.medium')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-600"></div>
                <span className="text-xs text-gray-600">{t('map.low')}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('map.total')}:
              </span>
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
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {selectedMetrics.length > 0 && aggregatedData.map((item, index) => {
          const coords = item.coordinates || [40.4168 + Math.random() * 10 - 5, -3.7038 + Math.random() * 10 - 5];
          const metric = selectedMetrics[0];
          
          return (
            <CircleMarker
              key={`${item.region}-${index}`}
              center={coords as LatLngExpression}
              radius={getMarkerSize(item, metric)}
              fillColor={getMarkerColor(item, metric)}
              color="white"
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
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
                        : 'N/A'} {t('map.unit')}
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
        <div className="absolute bottom-4 left-4 z-10">
          <Badge variant="outline" className="bg-white/95 backdrop-blur-sm">
            {statusMessage}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
