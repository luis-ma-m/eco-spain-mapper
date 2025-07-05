
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { MapPin } from 'lucide-react';

const Header = () => {
  const { t, language, changeLanguage } = useTranslation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                CO₂ España
              </h1>
              <p className="text-xs text-gray-500">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              {t('nav.home')}
            </a>
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              {t('nav.data')}
            </a>
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              {t('nav.about')}
            </a>
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeLanguage('es')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'es' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'en' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
