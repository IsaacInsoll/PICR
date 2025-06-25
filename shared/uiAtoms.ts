
import { atom } from 'jotai';

// default to '2 hours ago' but allow toggle to Y-m-d H:i:s
export const dateDisplayRelativeAtom = atom(true);
