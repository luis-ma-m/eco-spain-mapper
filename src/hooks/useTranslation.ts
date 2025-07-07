import { useContext } from 'react';
import { TranslationContext } from '../context/TranslationContext';

export const useTranslation = () => {
  return useContext(TranslationContext);
};
