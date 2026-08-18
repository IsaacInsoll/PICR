import 'i18next';
import type { EnglishResources } from '@shared/i18n/resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: EnglishResources;
    returnNull: false;
  }
}
