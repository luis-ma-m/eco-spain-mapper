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
  'filters.category': { es: 'Categoría', en: 'Category' },
  'filters.value': { es: 'Valor', en: 'Value' },
  'filters.reset': { es: 'Restablecer', en: 'Reset' },
  'filters.apply': { es: 'Aplicar', en: 'Apply' },
  'filters.allRegions': { es: 'Todas las regiones', en: 'All regions' },
  'filters.allYears': { es: 'Todos los años', en: 'All years' },
  'filters.allCategories': { es: 'Todas las categorías', en: 'All categories' },
  'filters.allValues': { es: 'Todos los valores', en: 'All values' },
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
  'map.selectMetricPlaceholder': { es: 'Seleccionar métrica…', en: 'Select metric…' },
  'map.regionsLabel': { es: 'regiones', en: 'regions' },
  'map.spainTotal': {
    es: 'Total España: {value} {unit}',
    en: 'Spain total: {value} {unit}',
  },
  'map.na': { es: 'N/D', en: 'N/A' },

  // Mobile/Side menu labels
  'menu.mapControls': { es: 'Controles del mapa', en: 'Map Controls' },
  'menu.metrics': { es: 'Métricas', en: 'Metrics' },
  'menu.legend': { es: 'Leyenda', en: 'Legend' },
  'menu.upload': { es: 'Cargar', en: 'Upload' },
  'menu.filters': { es: 'Filtros', en: 'Filters' },

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
    es: 'Esta aplicación muestra las emisiones de CO₂ en España utilizando datos de Climate Trace.',
    en: 'This application displays CO₂ emissions in Spain using Climate Trace data.',
  },
  'about.author': { es: 'Autor: Luis Martín Maíllo', en: 'Author: Luis Martín Maíllo' },
  'about.cc': {
    es: 'Datos disponibles bajo licencia CC BY 4.0 de',
    en: 'Data available under a CC BY 4.0 license from',
  },

  // Not Found page
  'notFound.title': { es: '404', en: '404' },
  'notFound.message': {
    es: '¡Vaya! Página no encontrada',
    en: 'Oops! Page not found',
  },
  'notFound.back': { es: 'Volver al inicio', en: 'Return to Home' },

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

  // Index page status messages
  'index.loadedUpload': {
    es: 'Se cargaron {{count}} registros desde la subida',
    en: 'Loaded {{count}} records from upload',
  },
  'index.loadingDefault': {
    es: 'Cargando datos predeterminados desde {{url}}',
    en: 'Fetching default data from {{url}}',
  },
  'index.loadedDefault': {
    es: 'Se cargaron {{count}} registros del CSV predeterminado',
    en: 'Loaded {{count}} records from default CSV',
  },
  'index.errorLoad': {
    es: 'Error al cargar CSV: {{msg}}',
    en: 'Error loading CSV: {{msg}}',
  },

  // Sector categories
  'category.agriculture': { es: 'Agricultura', en: 'Agriculture' },
  'category.buildings': { es: 'Edificios', en: 'Buildings' },
  'category.forestry-and-land-use': { es: 'Uso forestal y de suelo', en: 'Forestry and land use' },
  'category.fossil-fuel-operations': { es: 'Operaciones de combustibles fósiles', en: 'Fossil fuel operations' },
  'category.manufacturing': { es: 'Manufactura', en: 'Manufacturing' },
  'category.mineral-extraction': { es: 'Extracción minera', en: 'Mineral extraction' },
  'category.power': { es: 'Energía', en: 'Power' },
  'category.transportation': { es: 'Transporte', en: 'Transportation' },
  'category.waste': { es: 'Residuos', en: 'Waste' },

  // Sector values
  'value.aluminum': { es: 'Aluminio', en: 'Aluminum' },
  'value.cement': { es: 'Cemento', en: 'Cement' },
  'value.chemicals': { es: 'Químicos', en: 'Chemicals' },
  'value.coal-mining': { es: 'Minería de carbón', en: 'Coal mining' },
  'value.copper-mining': { es: 'Minería de cobre', en: 'Copper mining' },
  'value.crop-residues': { es: 'Residuos de cultivo', en: 'Crop residues' },
  'value.cropland-fires': { es: 'Incendios en tierras de cultivo', en: 'Cropland fires' },
  'value.domestic-aviation': { es: 'Aviación doméstica', en: 'Domestic aviation' },
  'value.domestic-shipping': { es: 'Transporte marítimo doméstico', en: 'Domestic shipping' },
  'value.domestic-wastewater-treatment-and-discharge': { es: 'Tratamiento de aguas residuales domésticas', en: 'Domestic wastewater treatment and discharge' },
  'value.electricity-generation': { es: 'Generación de electricidad', en: 'Electricity generation' },
  'value.enteric-fermentation-cattle-pasture': { es: 'Fermentación entérica ganado en pastura', en: 'Enteric fermentation cattle pasture' },
  'value.food-beverage-tobacco': { es: 'Alimentos, bebidas y tabaco', en: 'Food, beverage and tobacco' },
  'value.forest-land-clearing': { es: 'Desbroce de terrenos forestales', en: 'Forest land clearing' },
  'value.forest-land-degradation': { es: 'Degradación de terrenos forestales', en: 'Forest land degradation' },
  'value.forest-land-fires': { es: 'Incendios forestales', en: 'Forest land fires' },
  'value.glass': { es: 'Vidrio', en: 'Glass' },
  'value.industrial-wastewater-treatment-and-discharge': { es: 'Tratamiento de aguas residuales industriales', en: 'Industrial wastewater treatment and discharge' },
  'value.international-aviation': { es: 'Aviación internacional', en: 'International aviation' },
  'value.international-shipping': { es: 'Transporte marítimo internacional', en: 'International shipping' },
  'value.iron-and-steel': { es: 'Hierro y acero', en: 'Iron and steel' },
  'value.iron-mining': { es: 'Minería de hierro', en: 'Iron mining' },
  'value.lime': { es: 'Cal', en: 'Lime' },
  'value.manure-applied-to-soils': { es: 'Estiércol aplicado al suelo', en: 'Manure applied to soils' },
  'value.manure-left-on-pasture-cattle': { es: 'Estiércol en pastura de ganado', en: 'Manure left on pasture cattle' },
  'value.net-forest-land': { es: 'Superficie forestal neta', en: 'Net forest land' },
  'value.net-shrubgrass': { es: 'Matorrales netos', en: 'Net shrubgrass' },
  'value.net-wetland': { es: 'Humedal neto', en: 'Net wetland' },
  'value.non-residential-onsite-fuel-usage': { es: 'Uso de combustible no residencial', en: 'Non residential onsite fuel usage' },
  'value.oil-and-gas-production': { es: 'Producción de petróleo y gas', en: 'Oil and gas production' },
  'value.oil-and-gas-refining': { es: 'Refinado de petróleo y gas', en: 'Oil and gas refining' },
  'value.oil-and-gas-transport': { es: 'Transporte de petróleo y gas', en: 'Oil and gas transport' },
  'value.other-metals': { es: 'Otros metales', en: 'Other metals' },
  'value.petrochemical-steam-cracking': { es: 'Craqueo a vapor petroquímico', en: 'Petrochemical steam cracking' },
  'value.pulp-and-paper': { es: 'Pulpa y papel', en: 'Pulp and paper' },
  'value.removals': { es: 'Absorciones', en: 'Removals' },
  'value.residential-onsite-fuel-usage': { es: 'Uso de combustible residencial', en: 'Residential onsite fuel usage' },
  'value.rice-cultivation': { es: 'Cultivo de arroz', en: 'Rice cultivation' },
  'value.road-transportation': { es: 'Transporte por carretera', en: 'Road transportation' },
  'value.shrubgrass-fires': { es: 'Incendios en matorrales', en: 'Shrubgrass fires' },
  'value.solid-waste-disposal': { es: 'Eliminación de residuos sólidos', en: 'Solid waste disposal' },
  'value.synthetic-fertilizer-application': { es: 'Aplicación de fertilizantes sintéticos', en: 'Synthetic fertilizer application' },
  'value.textiles-leather-apparel': { es: 'Textiles, cuero y confecciones', en: 'Textiles leather apparel' },
  'value.water-reservoirs': { es: 'Embalses de agua', en: 'Water reservoirs' },
  'value.wetland-fires': { es: 'Incendios en humedales', en: 'Wetland fires' },
};

interface TranslationContextProps {
  t: (key: string, params?: Record<string, string | number>) => string;
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
    (key: string, params?: Record<string, string | number>) => {
      let str = translations[key]?.[language] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          const val = String(v);
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), val);
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), val);
        });
      }
      return str;
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

