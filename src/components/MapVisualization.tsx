import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../hooks/useTranslation';
import { CO2Data } from './DataUpload';
import { FilterState } from './FilterPanel';
import { sanitizeHtml, sanitizeString } from '../utils/security';

interface MapVisualizationProps {
  data: CO2Data[];
  filters: FilterState;
  isLoading?: boolean;
  error?: string | null;
  statusMessage?: string;
}

const ZoomListener: React.FC<{ onZoom: (z: number) => void }> = ({ onZoom }) => {
  useMapEvents({
    zoomend(e) {
      onZoom(e.target.getZoom());
    },
  });
  return null;
};

const MapVisualization: React.FC<MapVisualizationProps> = ({
  data,
  filters,
  isLoading = false,
  error = null,
  statusMessage,
}) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(6);
  const centerCoords: LatLngExpression = [40.4165, -3.7026];

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Validate item structure
      if (!item || typeof item !== 'object') return false;
      if (!item.region || !item.year || typeof item.emissions !== 'number') return false;
      if (item.emissions < 0 || !isFinite(item.emissions)) return false;
      
      // Apply filters
      if (filters.region && sanitizeString(item.region) !== sanitizeString(filters.region)) return false;
      if (filters.year && item.year !== filters.year) return false;
      if (filters.sector && sanitizeString(item.sector) !== sanitizeString(filters.sector)) return false;
      
      return true;
    });
  }, [data, filters]);

  const regionEmissions = useMemo(() => {
    const emissions: { [region: string]: number } = {};
    
    filteredData.forEach(item => {
      const region = sanitizeString(item.region);
      if (!region) return;
      
      if (!emissions[region]) {
        emissions[region] = 0;
      }
      
      const itemEmissions = Math.max(0, item.emissions || 0);
      if (isFinite(itemEmissions)) {
        emissions[region] += itemEmissions;
      }
    });
    
    return emissions;
  }, [filteredData]);

  const { minEmission, maxEmission } = useMemo(() => {
    const values = Object.values(regionEmissions).filter(v => isFinite(v) && v > 0);
    if (values.length === 0) return { minEmission: 0, maxEmission: 1 };
    return { minEmission: Math.min(...values), maxEmission: Math.max(...values) };
  }, [regionEmissions]);

  const getEmissionColor = (emission: number): string => {
    if (!isFinite(emission) || emission < 0) return '#e5e7eb';
    
    const intensity = Math.min(Math.max(emission / maxEmission, 0), 1);
    const red = Math.floor(255 * intensity);
    const green = Math.floor(255 * (1 - intensity * 0.8));
    const blue = Math.floor(100 * (1 - intensity));
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  const spanishRegions = [
    { name: 'Andalucía', coords: [37.7749, -4.7324] },
    { name: 'Aragón', coords: [41.5868, -0.8296] },
    { name: 'Asturias', coords: [43.3619, -5.8494] },
    { name: 'Baleares', coords: [39.6953, 3.0176] },
    { name: 'Canarias', coords: [28.2916, -16.6291] },
    { name: 'Cantabria', coords: [43.1828, -3.9878] },
    { name: 'Castilla-La Mancha', coords: [39.5663, -2.9908] },
    { name: 'Castilla y León', coords: [41.6523, -4.7245] },
    { name: 'Cataluña', coords: [41.8019, 1.8734] },
    { name: 'Comunidad Valenciana', coords: [39.4840, -0.7532] },
    { name: 'Extremadura', coords: [39.1622, -6.3432] },
    { name: 'Galicia', coords: [42.5751, -8.1339] },
    { name: 'Madrid', coords: [40.4165, -3.7026] },
    { name: 'Murcia', coords: [37.9922, -1.1307] },
    { name: 'Navarra', coords: [42.6954, -1.6761] },
    { name: 'País Vasco', coords: [43.2630, -2.9340] },
    { name: 'La Rioja', coords: [42.2871, -2.5396] }
  ];

  const getRadius = (emission: number) => {
    if (!isFinite(emission) || emission <= 0) return 8;
    if (maxEmission === minEmission) return 20 * (zoom / 6);

    const minSize = 8;
    const maxSize = 50;
    const normalized = (emission - minEmission) / (maxEmission - minEmission);
    const radius = minSize + normalized * (maxSize - minSize);
    return radius * (zoom / 6);
  };

  const formatNumber = (num: number): string => {
    if (!isFinite(num)) return '0';
    return (num / 1_000_000).toFixed(2);
  };

  const formatTotalEmissions = (num: number): string => {
    if (!isFinite(num)) return '0.00';
    return (num / 1_000_000).toFixed(2);
  };

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 4rem)' }}>
      <MapContainer
        center={centerCoords}
        zoom={zoom}
        zoomControl={false}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <ZoomControl position="topright" />
        <ZoomListener onZoom={setZoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {spanishRegions.map((region) => {
          const emission = regionEmissions[region.name] || 0;
          const color = emission > 0 ? getEmissionColor(emission) : '#e5e7eb';
          const sanitizedRegionName = sanitizeHtml(region.name);

          return (
            <CircleMarker
              key={region.name}
              center={region.coords as [number, number]}
              pathOptions={{
                color: '#333',
                fillColor: color,
                fillOpacity: 0.8,
                radius: getRadius(emission),
              }}
            >
              <Tooltip>
                <div className="text-center">
                  <div className="text-xs font-medium" dangerouslySetInnerHTML={{ __html: sanitizedRegionName }} />
                  {emission > 0 && (
                    <div className="text-xs">
                      {formatNumber(emission)}M {sanitizeHtml(t('map.unit'))}
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">{sanitizeHtml(t('map.title'))}</h3>
        <p className="text-sm text-gray-600">
          {filteredData.length} registros • {Object.keys(regionEmissions).length} regiones
        </p>
      </div>
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="text-sm font-semibold mb-2">{sanitizeHtml(t('map.legend'))}</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xs">Alta emisión</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-xs">Media emisión</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-xs">Baja emisión</span>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-sm">
            <div className="font-semibold">Total Emisiones</div>
            <div className="text-2xl font-bold text-green-600">
              {formatTotalEmissions(Object.values(regionEmissions).reduce((a, b) => a + b, 0))}M
            </div>
            <div className="text-xs text-gray-600">{sanitizeHtml(t('map.unit'))}</div>
          </div>
        </div>

        {(isLoading || error || filteredData.length === 0) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="bg-white bg-opacity-80 px-4 py-2 rounded">
              <p className="text-gray-600 text-center">
                {sanitizeHtml(
                  isLoading
                    ? t('data.loading')
                    : error
                    ? `${t('data.error')}: ${error}`
                    : t('data.noData')
                )}
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="pointer-events-none absolute top-2 left-2 bg-white bg-opacity-70 rounded px-2 py-1 shadow">
            <p className="text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(statusMessage) }} />
          </div>
        )}
      </div>
  );
};

export default MapVisualization;
