import { atom, getDefaultStore } from 'jotai';

export type PublicLinkAccessIncident = {
  id: number;
  uuid: string;
  reason: 'expired';
};

export const publicLinkAccessIncidentAtom =
  atom<PublicLinkAccessIncident | null>(null);

const store = getDefaultStore();
let nextIncidentId = 1;

export const reportExpiredPublicLink = (uuid: string): void => {
  const current = store.get(publicLinkAccessIncidentAtom);
  if (current?.uuid === uuid) return;
  store.set(publicLinkAccessIncidentAtom, {
    id: nextIncidentId++,
    uuid,
    reason: 'expired',
  });
};

export const clearPublicLinkAccessIncident = (uuid: string): void => {
  if (store.get(publicLinkAccessIncidentAtom)?.uuid === uuid) {
    store.set(publicLinkAccessIncidentAtom, null);
  }
};
