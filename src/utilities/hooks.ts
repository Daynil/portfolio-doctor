import { useEffect, useState } from 'react';

/**
 * Initialize with local storage value if exists, update
 * local storage on state updates.
 * @param key Local storage key
 * @param defaultValue
 */
export function useLocalStorage(key: string, defaultValue: any) {
  const [usedDefault, setUsedDefault] = useState(true);
  const [stored, setStored] = useState(() => {
    let initialStored = defaultValue;
    let existingStored =
      typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;

    if (existingStored) {
      try {
        existingStored = JSON.parse(existingStored);
        initialStored = existingStored;
        setUsedDefault(false);
        console.log('in existing ' + key, existingStored);
      } catch (e) {} // If parse error, fall back to defaults
    }
    console.log('stored ' + key, initialStored);
    return initialStored;
  });
  const updateStored = (value) => {
    setStored(value);
    setUsedDefault(false);
  };
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(stored));
  }, [stored]);
  return { stored, updateStored, usedDefault };
}

export function usePreferredDataset(
  defaultDataset: string
): {
  preferredDataset: string;
  setPreferredDataset: (value: string) => void;
} {
  const { stored, updateStored } = useLocalStorage(
    'preferredData',
    defaultDataset
  );
  return { preferredDataset: stored, setPreferredDataset: updateStored };
}

export type StoredDataset = { name: string; csvString: string };

export function useStoredDatasets(
  defaultDatasets: StoredDataset[]
): {
  storedDatasets: StoredDataset[];
  setStoredDatasets: (value: StoredDataset[]) => void;
} {
  const { stored, updateStored } = useLocalStorage(
    'storedDatasets',
    defaultDatasets
  );
  return { storedDatasets: stored, setStoredDatasets: updateStored };
}
