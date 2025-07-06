import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

export type Language = 'es' | 'en';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Header
  'nav.home': { es: 'Inicio', en: 'Home' },
  'nav.data': { es: 'Datos', en: 'Data' },
  'nav.about': { es: 'Acerca de', en: 'About' },

  // Main content
  'title': { es: 'Visualizador de Emisiones CO₂ en España', en: 'CO₂ Emissions Visualizer in Spain' },
  'subtitle': { es: 'Explora los datos de emisiones de dióxido de carbono por regiones', en: 'Explore carbon dioxide emissions data by regions' },

  // Filters
  'filters.title': { es: 'Filtros', en: 'Filters' },
  'filters.region': { es: 'Región', en: 'Region' },
  'filters.year': { es: 'Año', en: 'Year' },
  'filters.sector': { es: 'Sector', en: 'Sector' },
  'filters.reset': { es: 'Restablecer', en: 'Reset' },
  'filters.apply': { es: 'Aplicar', en: 'Apply' },
  'filters.allRegions': { es: 'Todas las regiones', en: 'All regions' },
  'filters.allYears': { es: 'Todos los años', en: 'All years' },
  'filters.allSectors': { es: 'Todos los sectores', en: 'All sectors' },
  'filters.active': { es: 'Filtros activos', en: 'Active filters' },
  'filters.none': { es: 'Ninguno', en: 'None' },

  // Data
  'data.loading': { es: 'Cargando datos...', en: 'Loading data...' },
  'data.error': { es: 'Error al cargar los datos', en: 'Error loading data' },
  'data.noData': { es: 'No hay datos disponibles', en: 'No data available' },

  // Map
  'map.title': { es: 'Mapa de Emisiones', en: 'Emissions Map' },
  'map.legend': { es: 'Leyenda', en: 'Legend' },
  'map.unit': { es: 'Mt CO₂', en: 'Mt CO₂' },
  'map.high': { es: 'Alta emisión', en: 'High emission' },
  'map.medium': { es: 'Media emisión', en: 'Medium emission' },
  'map.low': { es: 'Baja emisión', en: 'Low emission' },
  'map.total': { es: 'Total Emisiones', en: 'Total Emissions' },
  'map.selectMetrics': { es: 'Seleccionar métricas', en: 'Select metrics' },

  // Upload
  'upload.title': { es: 'Subir Archivo CSV', en: 'Upload CSV File' },
  'upload.button': { es: 'Seleccionar archivo', en: 'Select file' },
  'upload.processing': { es: 'Procesando...', en: 'Processing...' },
  'upload.default': { es: 'Cargar datos ClimateTrace', en: 'Load ClimateTrace data' },
  'upload.instructionsTitle': { es: 'Formato esperado del CSV:', en: 'Expected CSV format:' },
  'upload.instruction.columns': { es: 'Columnas: region, year, sector, emissions', en: 'Columns: region, year, sector, emissions' },
  'upload.instruction.optional': { es: 'Opcionalmente: lat, lng para coordenadas', en: 'Optional: lat, lng for coordinates' },
  'upload.instruction.headers': { es: 'Primera fila debe contener los encabezados', en: 'First row must contain headers' },

  // About page
  'about.purpose': {
    es: 'Esta aplicación muestra las emisiones de CO₂ en España utilizando datos de Climate Trace.',
    en: 'This application displays CO₂ emissions in Spain using Climate Trace data.',
  },
  'about.author': { es: 'Autor: Luis Martín Maíllo', en: 'Author: Luis Martín Maíllo' },
  'about.cc': {
    es: 'Datos disponibles bajo licencia CC BY 4.0 de',
    en: 'Data available under a CC BY 4.0 license from',
  },

  // Error Boundary
  'errorBoundary.title': { es: 'Error de aplicación', en: 'Application error' },
  'errorBoundary.message': {
    es: 'Ha ocurrido un error inesperado. Por favor, recarga la página.',
    en: 'An unexpected error occurred. Please reload the page.',
  },
  'errorBoundary.console': {
    es: 'Revisa la consola del navegador para ver el seguimiento completo del error.',
    en: 'Check the browser console for the full error trace.',
  },
  'errorBoundary.reload': { es: 'Recargar página', en: 'Reload page' },
  'errorBoundary.retry': { es: 'Intentar de nuevo', en: 'Try again' },
};

interface TranslationContextProps {
  t: (key: string) => string;
  language: Language;
  changeLanguage: (lang: Language) => void;
}

export const TranslationContext = createContext<TranslationContextProps>({
  t: (key: string) => key,
  language: 'es',
  changeLanguage: () => {},
});

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang && ['es', 'en'].includes(savedLang)) {
        setLanguage(savedLang);
      }
    } catch (error) {
      console.warn('Unable to access localStorage:', error);
    }
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (error) {
      console.warn('Unable to store language preference:', error);
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[key]?.[language] || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ t, language, changeLanguage }),
    [t, language, changeLanguage]
  );

  return (
    <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
  );
};

