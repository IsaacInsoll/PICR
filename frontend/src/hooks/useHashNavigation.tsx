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
  createHashNavigationCoordinator,
  type BuildHashNavigation,
} from '../helpers/hashNavigationCoordinator';

interface HashNavigationContextValue {
  getCurrentLocation: ReturnType<
    typeof createHashNavigationCoordinator
  >['current'];
  navigateHash: (build: BuildHashNavigation) => void;
}

const HashNavigationContext = createContext<
  HashNavigationContextValue | undefined
>(undefined);

export const HashNavigationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [coordinator] = useState(() =>
    createHashNavigationCoordinator(location),
  );

  useLayoutEffect(() => {
    coordinator.sync(location);
  }, [coordinator, location]);

  const navigateHash = useCallback(
    (build: BuildHashNavigation) => {
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
    () => ({ getCurrentLocation, navigateHash }),
    [getCurrentLocation, navigateHash],
  );

  return (
    <HashNavigationContext.Provider value={value}>
      {children}
    </HashNavigationContext.Provider>
  );
};

export const useHashNavigation = () => {
  const value = useContext(HashNavigationContext);
  if (!value) {
    throw new Error('useHashNavigation requires HashNavigationProvider');
  }
  return value;
};
