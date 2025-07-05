
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import FilterPanel, { FilterState } from '../components/FilterPanel';
import DataUpload, { CO2Data } from '../components/DataUpload';
import MapVisualization from '../components/MapVisualization';
import { useTranslation } from '../hooks/useTranslation';

const Index = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<CO2Data[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    region: null,
    year: null,
    sector: null
  });

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const regions = [...new Set(data.map(item => item.region))].filter(Boolean).sort();
    const years = [...new Set(data.map(item => item.year))].filter(Boolean).sort();
    const sectors = [...new Set(data.map(item => item.sector))].filter(Boolean).sort();
    
    return { regions, years, sectors };
  }, [data]);

  const handleDataLoaded = (newData: CO2Data[]) => {
    setData(newData);
    console.log('Data loaded:', newData.length, 'records');
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Herramienta interactiva para explorar y visualizar datos de emisiones de CO₂ 
            por comunidades autónomas, sectores industriales y períodos temporales en España.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Data Upload */}
            <DataUpload onDataLoaded={handleDataLoaded} />
            
            {/* Filters */}
            {data.length > 0 && (
              <FilterPanel
                onFiltersChange={handleFiltersChange}
                availableRegions={filterOptions.regions}
                availableYears={filterOptions.years}
                availableSectors={filterOptions.sectors}
              />
            )}

            {/* Statistics */}
            {data.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Estadísticas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total registros:</span>
                    <span className="font-medium">{data.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Regiones:</span>
                    <span className="font-medium">{filterOptions.regions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Años:</span>
                    <span className="font-medium">
                      {filterOptions.years.length > 0 
                        ? `${Math.min(...filterOptions.years)} - ${Math.max(...filterOptions.years)}`
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sectores:</span>
                    <span className="font-medium">{filterOptions.sectors.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {data.length > 0 ? (
                <MapVisualization data={data} filters={filters} />
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sube tu archivo CSV para comenzar
                    </h3>
                    <p className="text-gray-600">
                      Una vez cargues los datos, podrás explorar las emisiones de CO₂ 
                      de forma interactiva en el mapa de España.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Notice */}
        {data.length > 10000 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Dataset grande detectado
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Estás trabajando con {data.length.toLocaleString()} registros. 
                    Para optimizar el rendimiento, considera usar los filtros para reducir 
                    la cantidad de datos visualizados simultáneamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
