
import React, { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { CO2Data } from './DataUpload';
import { FilterState } from './FilterPanel';

interface MapVisualizationProps {
  data: CO2Data[];
  filters: FilterState;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ data, filters }) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* Map Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{t('map.title')}</h3>
        <p className="text-sm text-gray-600">
          {filteredData.length} registros • {Object.keys(regionEmissions).length} regiones
        </p>
      </div>

      {/* Map Content */}
      <div ref={mapRef} className="relative w-full h-96 bg-blue-50">
        {/* SVG Map Placeholder - Spain outline */}
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-full"
          style={{ background: 'linear-gradient(to bottom, #e6f3ff, #b3d9ff)' }}
        >
          {/* Simplified Spain regions */}
          {spanishRegions.map((region) => {
            const emission = regionEmissions[region.name] || 0;
            const color = emission > 0 ? getEmissionColor(emission) : '#e5e7eb';
            const x = (region.coords[1] + 10) * 40; // Longitude to X
            const y = (50 - region.coords[0]) * 12; // Latitude to Y (inverted)
            
            return (
              <g key={region.name}>
                {/* Region circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={Math.max(8, Math.sqrt(emission / 1000))}
                  fill={color}
                  stroke="#333"
                  strokeWidth="1"
                  opacity="0.8"
                  className="hover:opacity-100 cursor-pointer transition-opacity"
                />
                {/* Region label */}
                <text
                  x={x}
                  y={y + Math.max(8, Math.sqrt(emission / 1000)) + 15}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700"
                  style={{ fontSize: '10px' }}
                >
                  {region.name}
                </text>
                {/* Emission value */}
                {emission > 0 && (
                  <text
                    x={x}
                    y={y + Math.max(8, Math.sqrt(emission / 1000)) + 28}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                    style={{ fontSize: '8px' }}
                  >
                    {(emission / 1000).toFixed(1)}k {t('map.unit')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
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

        {/* Data Summary */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-sm">
            <div className="font-semibold">Total Emisiones</div>
            <div className="text-2xl font-bold text-green-600">
              {(Object.values(regionEmissions).reduce((a, b) => a + b, 0) / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-600">{t('map.unit')}</div>
          </div>
        </div>
      </div>

      {/* No data message */}
      {filteredData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <p className="text-gray-600">{t('data.noData')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
