import { atom } from 'jotai/index';
import { MinimalFolder } from '../../../types';

// When you select a folder to navigate to, populate this as the placeholder while it loads
export const placeholderFolder = atom<MinimalFolder | undefined>(undefined);
