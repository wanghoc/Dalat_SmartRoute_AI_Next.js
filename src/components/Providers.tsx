'use client';

import { useEffect, type ReactNode } from 'react';

import { AuthProvider } from '@/context/AuthContext';
import i18n from '@/lib/i18n';

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    const savedLang = window.localStorage.getItem('dalat_lang');
    if (savedLang && savedLang !== i18n.language) {
      void i18n.changeLanguage(savedLang);
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
