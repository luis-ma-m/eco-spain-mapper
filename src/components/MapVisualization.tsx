
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../hooks/useTranslation';
import { CO2Data } from './DataUpload';
import { FilterState } from './FilterPanel';

interface MapVisualizationProps {
  data: CO2Data[];
  filters: FilterState;
}

const ZoomListener: React.FC<{ onZoom: (z: number) => void }> = ({ onZoom }) => {
  useMapEvents({
    zoomend(e) {
      onZoom(e.target.getZoom());
    },
  });
  return null;
};

const MapVisualization: React.FC<MapVisualizationProps> = ({ data, filters }) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(6);
  const center: [number, number] = [40.4165, -3.7026];

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.region && item.region !== filters.region) return false;
      if (filters.year && item.year !== filters.year) return false;
      if (filters.sector && item.sector !== filters.sector) return false;
      return true;
    });
  }, [data, filters]);

  // Calculate aggregated emissions by region
  const regionEmissions = useMemo(() => {
    const emissions: { [region: string]: number } = {};
    filteredData.forEach(item => {
      if (!emissions[item.region]) {
        emissions[item.region] = 0;
      }
      emissions[item.region] += item.emissions;
    });
    return emissions;
  }, [filteredData]);

  // Get max emission value for color scaling
  const maxEmission = useMemo(() => {
    return Math.max(...Object.values(regionEmissions), 1);
  }, [regionEmissions]);

  // Color scale function
  const getEmissionColor = (emission: number): string => {
    const intensity = Math.min(emission / maxEmission, 1);
    const red = Math.floor(255 * intensity);
    const green = Math.floor(255 * (1 - intensity * 0.8));
    const blue = Math.floor(100 * (1 - intensity));
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Spanish regions with approximate coordinates (simplified for demo)
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

  const getRadius = (emission: number) => Math.max(8, Math.sqrt(emission / 1000)) * (zoom / 6);

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      <div className="bg-white p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{t('map.title')}</h3>
        <p className="text-sm text-gray-600">
          {filteredData.length} registros • {Object.keys(regionEmissions).length} regiones
        </p>
      </div>
      <div className="relative w-full h-full min-h-[400px]">
        <MapContainer
          center={center}
          zoom={zoom}
          whenCreated={(m) => setZoom(m.getZoom())}
          zoomControl={false}
          className="w-full h-full"
          scrollWheelZoom
        >
          <ZoomControl position="topright" />
          <ZoomListener onZoom={setZoom} />
          <TileLayer
            attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {spanishRegions.map((region) => {
            const emission = regionEmissions[region.name] || 0;
            const color = emission > 0 ? getEmissionColor(emission) : '#e5e7eb';
            return (
              <CircleMarker
                key={region.name}
                center={region.coords as [number, number]}
                radius={getRadius(emission)}
                pathOptions={{ color: '#333', fillColor: color, fillOpacity: 0.8 }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent>
                  <div className="text-center">
                    <div className="text-xs font-medium">{region.name}</div>
                    {emission > 0 && (
                      <div className="text-xs">
                        {(emission / 1000).toFixed(1)}k {t('map.unit')}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="text-sm font-semibold mb-2">{t('map.legend')}</h4>
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
              {(Object.values(regionEmissions).reduce((a, b) => a + b, 0) / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-600">{t('map.unit')}</div>
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <p className="text-gray-600">{t('data.noData')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapVisualization;
