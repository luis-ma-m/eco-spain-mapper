import React from 'react';
import Header from '../components/Header';
import { useTranslation } from '../hooks/useTranslation';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto p-4 space-y-4">
        <h2 className="text-2xl font-bold">{t('nav.about')}</h2>
        <p>{t('about.purpose')}</p>
        <p>{t('about.author')}</p>
        <p className="text-sm text-gray-600">
          {t('about.cc')}{' '}
          <a
            href="https://climatetrace.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Climate Trace
          </a>.
        </p>
      </main>
    </div>
  );
};

export default About;
