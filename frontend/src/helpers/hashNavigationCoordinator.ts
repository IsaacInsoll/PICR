export interface HashNavigationLocation {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
}

export interface HashNavigationUpdate {
  hash: string;
  replace: boolean;
  state: unknown;
}

export interface PendingHashNavigation {
  to: Pick<HashNavigationLocation, 'pathname' | 'search' | 'hash'>;
  replace: boolean;
  state: unknown;
}

export type BuildHashNavigation = (
  location: HashNavigationLocation,
) => HashNavigationUpdate;

// Imperative hash writers update this optimistic location synchronously before
// asking Router to navigate, so another writer in the same tick sees the first
// one's hash and history state. Hash links, Back/Forward, and navigate(-1) do
// not have a predictable destination here; HashNavigationProvider calls sync()
// after Router commits those locations.
export const createHashNavigationCoordinator = (
  initialLocation: HashNavigationLocation,
) => {
  let currentLocation = initialLocation;

  return {
    current: () => currentLocation,
    sync: (location: HashNavigationLocation) => {
      currentLocation = location;
    },
    update: (build: BuildHashNavigation): PendingHashNavigation => {
      const update = build(currentLocation);
      currentLocation = {
        ...currentLocation,
        hash: update.hash,
        state: update.state,
      };

      return {
        to: {
          pathname: currentLocation.pathname,
          search: currentLocation.search,
          hash: currentLocation.hash,
        },
        replace: update.replace,
        state: currentLocation.state,
      };
    },
  };
};
