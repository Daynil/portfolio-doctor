import * as React from 'react';
import DatasetContextProvider from './src/data/data-context';
import './src/styles/global.css';

export const wrapRootElement = ({ element }) => (
  <DatasetContextProvider>{element}</DatasetContextProvider>
);
