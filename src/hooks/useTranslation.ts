
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
  
  // Data
  'data.loading': { es: 'Cargando datos...', en: 'Loading data...' },
  'data.error': { es: 'Error al cargar los datos', en: 'Error loading data' },
  'data.noData': { es: 'No hay datos disponibles', en: 'No data available' },
  
  // Map
  'map.title': { es: 'Mapa de Emisiones', en: 'Emissions Map' },
  'map.legend': { es: 'Leyenda', en: 'Legend' },
  'map.unit': { es: 'Mt CO₂', en: 'Mt CO₂' },
  
  // Upload
  'upload.title': { es: 'Subir Archivo CSV', en: 'Upload CSV File' },
  'upload.button': { es: 'Seleccionar archivo', en: 'Select file' },
  'upload.processing': { es: 'Procesando...', en: 'Processing...' },
  'upload.default': { es: 'Cargar datos ClimateTrace', en: 'Load ClimateTrace data' },
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('es'); // Default to Spanish

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
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
