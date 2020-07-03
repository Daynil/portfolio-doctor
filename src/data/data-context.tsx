import React, { useEffect, useState } from 'react';
import {
  StoredDataset,
  usePreferredDataset,
  useStoredDatasets
} from '../utilities/hooks';

export const defaultDatasetName = '(Default) jan-shiller-data.csv';
const defaultDataset = [
  {
    name: defaultDatasetName,
    csvString: ''
  }
];

export type DatasetContextType = {
  preferredDataset: string;
  setPreferredDataset: (value: string) => void;
  storedDatasets: StoredDataset[];
  setStoredDatasets: (value: StoredDataset[]) => void;
  /**
   * Default dataset needs to be invalidated on each page load in case of data updates.
   * Just load it once on initial page load, but don't store in local storage.
   */
  defaultDatasetCSVStringCache: string;
};

export const DatasetContext = React.createContext<DatasetContextType>({
  preferredDataset: defaultDatasetName,
  setPreferredDataset: null,
  storedDatasets: defaultDataset,
  setStoredDatasets: null,
  defaultDatasetCSVStringCache: ''
});

type Props = {
  children: React.ReactNode;
};

export default function DatasetContextProvider({ children }: Props) {
  const [
    defaultDatasetCSVStringCache,
    setDefaultDatasetCSVStringCache
  ] = useState('');
  const { preferredDataset, setPreferredDataset } = usePreferredDataset(
    defaultDatasetName
  );
  const { storedDatasets, setStoredDatasets } = useStoredDatasets(
    defaultDataset
  );

  useEffect(() => {
    const getData = async () => {
      const csvString = await (await fetch('/jan-shiller-data.csv')).text();
      setDefaultDatasetCSVStringCache(csvString);
    };
    getData();
  }, []);

  return (
    <DatasetContext.Provider
      value={{
        preferredDataset,
        setPreferredDataset,
        storedDatasets,
        setStoredDatasets,
        defaultDatasetCSVStringCache
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}
