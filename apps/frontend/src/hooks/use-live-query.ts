"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

export function useLiveQueryValue<T>(
  query: () => Promise<T>,
  initialValue: T,
) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const subscription = liveQuery(query).subscribe({
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
  }, [query]);

  return {
    loaded,
    value,
  };
}
