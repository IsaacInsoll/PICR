import { atom } from 'jotai';
import { PicrFolder } from '../../../types';

// When you select a folder to navigate to, populate this as the placeholder while it loads
export const placeholderFolder = atom<PicrFolder | undefined>(undefined);
