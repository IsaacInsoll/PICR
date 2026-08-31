import enAdmin from './locales/en/admin.json';
import enCommon from './locales/en/common.json';
import enGallery from './locales/en/gallery.json';
import deAdmin from './locales/de/admin.json';
import deCommon from './locales/de/common.json';
import deGallery from './locales/de/gallery.json';
import elAdmin from './locales/el/admin.json';
import elCommon from './locales/el/common.json';
import elGallery from './locales/el/gallery.json';
import esAdmin from './locales/es/admin.json';
import esCommon from './locales/es/common.json';
import esGallery from './locales/es/gallery.json';
import frAdmin from './locales/fr/admin.json';
import frCommon from './locales/fr/common.json';
import frGallery from './locales/fr/gallery.json';
import ukAdmin from './locales/uk/admin.json';
import ukCommon from './locales/uk/common.json';
import ukGallery from './locales/uk/gallery.json';
import type { SupportedLanguage } from './languages';

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
  el: {
    common: elCommon,
    gallery: elGallery,
    admin: elAdmin,
  },
  uk: {
    common: ukCommon,
    gallery: ukGallery,
    admin: ukAdmin,
  },
  de: {
    common: deCommon,
    gallery: deGallery,
    admin: deAdmin,
  },
  es: {
    common: esCommon,
    gallery: esGallery,
    admin: esAdmin,
  },
} as const satisfies Record<
  SupportedLanguage,
  Record<TranslationNamespace, unknown>
>;

export type EnglishResources = (typeof resources)['en'];
