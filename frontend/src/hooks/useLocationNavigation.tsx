import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  createLocationNavigationCoordinator,
  type BuildLocationNavigation,
} from '../helpers/locationNavigationCoordinator';

interface LocationNavigationContextValue {
  getCurrentLocation: ReturnType<
    typeof createLocationNavigationCoordinator
  >['current'];
  navigateLocation: (build: BuildLocationNavigation) => void;
}

const LocationNavigationContext = createContext<
  LocationNavigationContextValue | undefined
>(undefined);

export const LocationNavigationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [coordinator] = useState(() =>
    createLocationNavigationCoordinator(location),
  );

  useLayoutEffect(() => {
    coordinator.sync(location);
  }, [coordinator, location]);

  const navigateLocation = useCallback(
    (build: BuildLocationNavigation) => {
      const pending = coordinator.update(build);
      void navigate(pending.to, {
        replace: pending.replace,
        state: pending.state,
      });
    },
    [coordinator, navigate],
  );
  const getCurrentLocation = useCallback(
    () => coordinator.current(),
    [coordinator],
  );
  const value = useMemo(
    () => ({ getCurrentLocation, navigateLocation }),
    [getCurrentLocation, navigateLocation],
  );

  return (
    <LocationNavigationContext.Provider value={value}>
      {children}
    </LocationNavigationContext.Provider>
  );
};

export const useLocationNavigation = () => {
  const value = useContext(LocationNavigationContext);
  if (!value) {
    throw new Error(
      'useLocationNavigation requires LocationNavigationProvider',
    );
  }
  return value;
};
