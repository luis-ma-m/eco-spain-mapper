
import { useState, useEffect } from 'react';

type Language = 'es' | 'en';

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
  'upload.invalidFile': { es: 'Por favor, selecciona un archivo CSV válido', en: 'Please select a valid CSV file' },
  'upload.fileTooLarge': { es: 'El archivo es demasiado grande. Tamaño máximo: {size}MB', en: 'File is too large. Max size: {size}MB' },
  'upload.noValidData': { es: 'No se encontraron datos válidos en el archivo CSV', en: 'No valid data found in the CSV file' },
  'upload.success': { es: 'Datos cargados exitosamente: {count} registros', en: 'Data loaded successfully: {count} records' },
  'upload.loadError': { es: 'Error al cargar datos predefinidos: {error}', en: 'Error loading default data: {error}' },
  'upload.unknownError': { es: 'Error desconocido', en: 'Unknown error' },
  'upload.parseUnknownError': { es: 'Error desconocido al procesar CSV', en: 'Unknown error processing CSV' },
  'upload.maxSize': { es: 'Tamaño máximo: {size}MB', en: 'Max size: {size}MB' },
  'upload.maxRows': { es: 'Máximo {rows} filas', en: 'Maximum {rows} rows' },

  // About page
  'about.purpose': {
    es: 'Esta aplicaci\u00f3n muestra las emisiones de CO\u2082 en Espa\u00f1a utilizando datos de Climate Trace.',
    en: 'This application displays CO\u2082 emissions in Spain using Climate Trace data.',
  },
  'about.author': { es: 'Autor: Luis Mart\u00edn Ma\u00edllo', en: 'Author: Luis Mart\u00edn Ma\u00edllo' },
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

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('es'); // Default to Spanish

  const t = (
    key: string,
    params?: Record<string, string | number>
  ): string => {
    let str = translations[key]?.[language] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (error) {
      console.warn('Unable to store language preference:', error);
    }
  };

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

  return { t, language, changeLanguage };
};
