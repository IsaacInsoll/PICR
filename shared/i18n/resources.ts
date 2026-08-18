import enAdmin from './locales/en/admin.json';
import enCommon from './locales/en/common.json';
import enGallery from './locales/en/gallery.json';
import frAdmin from './locales/fr/admin.json';
import frCommon from './locales/fr/common.json';
import frGallery from './locales/fr/gallery.json';

export const namespaces = ['common', 'gallery', 'admin'] as const;
export type TranslationNamespace = (typeof namespaces)[number];

export const defaultNamespace: TranslationNamespace = 'common';

export const resources = {
  en: {
    common: enCommon,
    gallery: enGallery,
    admin: enAdmin,
  },
  fr: {
    common: frCommon,
    gallery: frGallery,
    admin: frAdmin,
  },
} as const;

export type EnglishResources = (typeof resources)['en'];
