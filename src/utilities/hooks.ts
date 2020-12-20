import { ResizeObserver } from '@juggle/resize-observer';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { debounced } from './util';

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
  }, [JSON.stringify(stored)]);
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

export type Dimensions = {
  height: number;
  width: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  boundedHeight: number;
  boundedWidth: number;
};

export function combineChartDimensions(dimensions: Partial<Dimensions>) {
  let parsedDimensions = {
    marginTop: 40,
    marginRight: 30,
    marginBottom: 40,
    marginLeft: 75,
    ...dimensions
  };

  return {
    ...parsedDimensions,
    boundedHeight: Math.max(
      parsedDimensions.height -
        parsedDimensions.marginTop -
        parsedDimensions.marginBottom,
      0
    ),
    boundedWidth: Math.max(
      parsedDimensions.width -
        parsedDimensions.marginLeft -
        parsedDimensions.marginRight,
      0
    )
  };
}

export function useChartDimensions(
  passedSettings: Partial<Dimensions>,
  aspectRatio?: number
): [MutableRefObject<HTMLDivElement>, Dimensions] {
  const ref = useRef<HTMLDivElement>();
  let dimensions = combineChartDimensions(passedSettings);

  const [width, changeWidth] = useState(0);
  const [height, changeHeight] = useState(0);

  useEffect(() => {
    function reset(e) {
      console.log(e);
      changeWidth(0);
      changeHeight(0);
    }
    window.addEventListener('resize', debounced(200, reset));
    return () => window.removeEventListener('resize', reset);
  }, []);

  useEffect(() => {
    if (dimensions.width && dimensions.height) return;

    const element = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries)) return;
      if (!entries.length) return;

      const entry = entries[0];

      if (aspectRatio) {
        if (width !== entry.contentRect.width) {
          changeWidth(entry.contentRect.width);
          changeHeight(Math.round(entry.contentRect.width / aspectRatio));
        } else if (height !== entry.contentRect.height) {
          changeHeight(entry.contentRect.height);
          changeWidth(Math.round(entry.contentRect.height * aspectRatio));
        }
      } else {
        if (width !== entry.contentRect.width) {
          changeWidth(entry.contentRect.width);
        }
        if (height !== entry.contentRect.height) {
          changeHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(element);

    return () => resizeObserver.unobserve(element);
  }, [passedSettings, width, height, dimensions]);

  const newSettings = combineChartDimensions({
    ...dimensions,
    width: dimensions.width || width,
    height: dimensions.height || height
  }) as Dimensions;

  return [ref, newSettings];
}
