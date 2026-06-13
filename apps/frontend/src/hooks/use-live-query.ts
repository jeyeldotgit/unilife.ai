"use client";

import { useEffect, useRef, useState, type DependencyList } from "react";
import { liveQuery } from "dexie";

export function useLiveQueryValue<T>(
  query: () => Promise<T>,
  initialValue: T,
  dependencies: DependencyList = [],
) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let isMounted = true;
    const subscription = liveQuery(() => queryRef.current()).subscribe({
      error: () => {
        if (isMounted) {
          setLoaded(true);
        }
      },
      next: (nextValue) => {
        if (!isMounted) {
          return;
        }

        setValue(nextValue);
        setLoaded(true);
      },
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // Callers choose the values that should restart the Dexie subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    loaded,
    value,
  };
}
