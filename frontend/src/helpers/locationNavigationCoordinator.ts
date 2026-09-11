export interface NavigationLocation {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
}

export interface LocationNavigationUpdate {
  pathname?: string;
  search?: string;
  hash?: string;
  replace: boolean;
  state: unknown;
}

export interface PendingLocationNavigation {
  to: Pick<NavigationLocation, 'pathname' | 'search' | 'hash'>;
  replace: boolean;
  state: unknown;
}

export type BuildLocationNavigation = (
  location: NavigationLocation,
) => LocationNavigationUpdate;

// Imperative location writers update this optimistic snapshot synchronously
// before asking Router to navigate. A second query/hash writer in the same tick
// therefore composes with the first instead of rebuilding from stale Router
// state. Links, Back/Forward, and navigate(-1) have no predictable destination
// here; LocationNavigationProvider calls sync() after Router commits them.
export const createLocationNavigationCoordinator = (
  initialLocation: NavigationLocation,
) => {
  let currentLocation = initialLocation;

  return {
    current: () => currentLocation,
    sync: (location: NavigationLocation) => {
      currentLocation = location;
    },
    update: (build: BuildLocationNavigation): PendingLocationNavigation => {
      const update = build(currentLocation);
      currentLocation = {
        pathname: update.pathname ?? currentLocation.pathname,
        search: update.search ?? currentLocation.search,
        hash: update.hash ?? currentLocation.hash,
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
