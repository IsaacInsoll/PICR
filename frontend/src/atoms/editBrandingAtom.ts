import { atom } from 'jotai';
import type { BrandingInput } from '../pages/management/BrandingForm';

export const editBrandingAtom = atom<BrandingInput | null>(null);

// When set, a newly created branding will be auto-assigned to this folder ID
export const assignBrandingToFolderAtom = atom<string | null>(null);
