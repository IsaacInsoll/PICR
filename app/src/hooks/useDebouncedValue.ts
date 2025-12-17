import { useEffect, useRef, useState } from 'react';

type UseDebouncedValueOptions = {
  leading?: boolean;
  trailing?: boolean;
};

// React Native friendly port of Mantine's useDebouncedValue
export const useDebouncedValue = <T>(
  value: T,
  delay: number,
  { leading = false, trailing = true }: UseDebouncedValueOptions = {},
) => {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leadingCalledRef = useRef(false);

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    cancel();

    if (leading && !leadingCalledRef.current) {
      leadingCalledRef.current = true;
      setDebounced(value);
      return undefined;
    }

    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        leadingCalledRef.current = false;
        setDebounced(value);
      }, delay);
    }

    return cancel;
  }, [value, delay, leading, trailing]);

  return [debounced, cancel] as const;
};
