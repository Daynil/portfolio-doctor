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
      } catch (e) {} // If parse error, fall back to defaults
    }
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

export type StoredDatasetPath = { datasetName: string; datasetPath: string };

export function useStoredDatasetPaths(
  defaultDatasetPaths: StoredDatasetPath[]
): {
  storedDatasetPaths: StoredDatasetPath[];
  setStoredDatasetPaths: (value: StoredDatasetPath[]) => void;
} {
  const { stored, updateStored } = useLocalStorage(
    'storedDatasetPaths',
    defaultDatasetPaths
  );
  return { storedDatasetPaths: stored, setStoredDatasetPaths: updateStored };
}

/**
 * Check local storage for existing site dark mode preference first.
 * If none exists, check for system color scheme preference.
 * Fall back to developer default.
 */
// export function useDarkMode(
//   darkDefault: boolean
// ): { darkMode: boolean; setDarkMode: (value: boolean) => void } {
//   const { stored, updateStored, usedDefault } = useLocalStorage(
//     'darkMode',
//     darkDefault
//   );
//   // On first render, only check user-preferred scheme if default value was used
//   useEffect(() => {
//     if (usedDefault)
//       updateStored(window.matchMedia('(prefers-color-scheme: dark)').matches);
//   }, []);
//   return { darkMode: stored, setDarkMode: updateStored };
// }
