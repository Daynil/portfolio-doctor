import React, { useEffect, useState } from 'react';
import {
  StoredDatasetPath,
  usePreferredDataset,
  useStoredDatasetPaths
} from '../utilities/hooks';
import Header from './header';
import TextLink from './text-link';

type Props = {
  path: string;
  children: React.ReactNode;
};

const defaultDataset = '(Default) jan-shiller-data.csv';
const defaultDatasetPaths = [
  {
    datasetName: defaultDataset,
    datasetPath: '/jan-shiller-data.csv'
  }
];

export const DatasetContext = React.createContext<{
  preferredDataset: string;
  setPreferredDataset: (value: string) => void;
  storedDatasetPaths: StoredDatasetPath[];
  setStoredDatasetPaths: (value: StoredDatasetPath[]) => void;
}>({
  preferredDataset: defaultDataset,
  setPreferredDataset: null,
  storedDatasetPaths: defaultDatasetPaths,
  setStoredDatasetPaths: null
});

const Layout = ({ path, children }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuOpen = () => setMenuOpen(!menuOpen);

  const { preferredDataset, setPreferredDataset } = usePreferredDataset(
    defaultDataset
  );
  const { storedDatasetPaths, setStoredDatasetPaths } = useStoredDatasetPaths(
    defaultDatasetPaths
  );

  useEffect(() => {
    if (menuOpen) document.body.style.overflowY = 'hidden';
    else {
      document.body.style.overflowY = 'unset';
      document.body.style.overflowY = 'overlay';
    }
  }, [menuOpen]);

  return (
    <DatasetContext.Provider
      value={{
        preferredDataset,
        setPreferredDataset,
        storedDatasetPaths,
        setStoredDatasetPaths
      }}
    >
      <div>
        <div className="min-h-screen dk:bg-gray-900 transition duration-200 ease-in-out border-t-4 border-green-500">
          <Header
            path={path}
            menuOpen={menuOpen}
            handleMenuOpen={handleMenuOpen}
          />
          <div
            className={`m-auto text-gray-900 text-lg px-6 transition duration-200 ease-in-out ${
              path !== '/simulator/' ? ' md:max-w-3xl' : ''
            }`}
          >
            <main>{children}</main>
            <footer className="text-gray-600 mt-32 pb-12">
              © {new Date().getFullYear()} Portfolio Doctor. All Rights
              Reserved. Created by{' '}
              <TextLink href="https://dlibin.net">Danny Libin</TextLink>.
            </footer>
          </div>
        </div>
      </div>
    </DatasetContext.Provider>
  );
};

export default Layout;
