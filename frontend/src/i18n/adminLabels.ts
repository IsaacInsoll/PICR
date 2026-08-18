import type { TFunction } from 'i18next';
import type {
  FontCategoryTranslator,
  FontDescriptionTranslator,
  FontSuitabilityTranslator,
} from '@shared/branding/fontRegistry';

export type AdminT = TFunction<'admin'>;

export const fontDescriptionTranslator =
  (t: AdminT): FontDescriptionTranslator =>
  (key) =>
    t(`font.description.${key}`, { ns: 'admin' });

export const fontCategoryTranslator =
  (t: AdminT): FontCategoryTranslator =>
  (key) =>
    t(`font.category.${key}`, { ns: 'admin' });

export const fontSuitabilityTranslator =
  (t: AdminT): FontSuitabilityTranslator =>
  (key) =>
    t(`font.suitability.${key}`, { ns: 'admin' });
