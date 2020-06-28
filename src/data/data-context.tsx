import React from 'react';
import {
  StoredDataset,
  usePreferredDataset,
  useStoredDatasets
} from '../utilities/hooks';

const defaultDatasetName = '(Default) jan-shiller-data.csv';
const defaultDataset = [
  {
    name: defaultDatasetName,
    csvString: ''
  }
];

export const DatasetContext = React.createContext<{
  preferredDataset: string;
  setPreferredDataset: (value: string) => void;
  storedDatasets: StoredDataset[];
  setStoredDatasets: (value: StoredDataset[]) => void;
}>({
  preferredDataset: defaultDatasetName,
  setPreferredDataset: null,
  storedDatasets: defaultDataset,
  setStoredDatasets: null
});

type Props = {
  children: React.ReactNode;
};

export default function DatasetContextProvider({ children }: Props) {
  const { preferredDataset, setPreferredDataset } = usePreferredDataset(
    defaultDatasetName
  );
  const { storedDatasets, setStoredDatasets } = useStoredDatasets(
    defaultDataset
  );

  return (
    <DatasetContext.Provider
      value={{
        preferredDataset,
        setPreferredDataset,
        storedDatasets,
        setStoredDatasets
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}
