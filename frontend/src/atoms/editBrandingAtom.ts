import { atom } from 'jotai';
import type { BrandingInput } from '../pages/management/BrandingForm';

export const editBrandingAtom = atom<BrandingInput | null>(null);
