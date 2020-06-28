import React, { useContext, useRef, useState } from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { MarketYearData } from '../data/calc/portfolio-calc';
import { DatasetContext } from '../data/data-context';
import { loadFile, parseCSVStringToJSON } from '../data/data-helpers';

type Props = {
  path: string;
};

export default function UploadData({ path }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [readData, setReadData] = useState<MarketYearData[]>(null);
  const [inputErr, setInputErr] = useState('');

  const {
    preferredDataset,
    setPreferredDataset,
    storedDatasets,
    setStoredDatasets
  } = useContext(DatasetContext);

  async function handleAddFile() {
    const uploadedFile = fileInput.current.files[0];

    if (!uploadedFile) {
      setInputErr('Select a file first!');
      return;
    }

    const existingDataset = storedDatasets.find(
      (dataset) => dataset.name === uploadedFile.name
    );

    if (existingDataset) {
      setInputErr(
        'This dataset already exists. If you wish to reupload it, remove the existing one or rename the file.'
      );
      return;
    }

    const fileData = await loadFile(fileInput.current.files[0]);

    const newDatasets = [
      ...storedDatasets,
      {
        name: uploadedFile.name,
        csvString: fileData
      }
    ];

    setPreferredDataset(uploadedFile.name);
    setStoredDatasets(newDatasets);
    setReadData(parseCSVStringToJSON(fileData));

    setInputErr('');
  }

  return (
    <Layout path={path}>
      <SEO title="About - Portfolio Doctor" />
      <h1 className="mt-20 text-center">Upload Custom Market Data</h1>
      <p>
        You can upload your own market data from a CSV file. The first row
        should be a header row with column names, though the name of the headers
        don't matter, you can name them whatever makes sense for you.
      </p>
      <p>
        The order of the columns is what matters. The order and format of each
        column is as follows:
      </p>
      <ul>
        <li>Year: YYYY integer</li>
        <li>Equities Price: float</li>
        <li>Dividend Per Equity Share: float</li>
        <li>Inflation Index: float</li>
        <li>Fixed Income Interest: float</li>
      </ul>
      <div className="flex flex-col mt-8">
        <label className="form-label" htmlFor="preferredDataset">
          Available dataset files
        </label>
        <select
          name="preferredDataset"
          id="preferredDataset"
          className="form-input"
        >
          {storedDatasets.map((dataset, i) => (
            <option key={i} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>
        <div className="flex mt-4">
          <button className="btn btn-green">Set Active</button>
          <button className="btn btn-green ml-4">Remove</button>
        </div>
      </div>
      <div className="flex flex-col mt-8">
        <label className="form-label" htmlFor="csv">
          Add a new CSV file to use
        </label>
        <input
          type="file"
          id="csv"
          name="csv"
          accept=".csv"
          className="form-input"
          ref={fileInput}
        />
        <div className="flex mt-4">
          <button className="btn btn-green" onClick={() => handleAddFile()}>
            Add
          </button>
        </div>
        {inputErr ? (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 py-2 px-4 mt-4"
            role="alert"
          >
            <p className="font-bold">Input Error</p>
            <p className="text-sm">{inputErr}</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col mt-8">
        <label className="form-label">Currently Active Dataset</label>
        <div className="text-lg font-bold">{preferredDataset}</div>
        <div className="mt-4">{JSON.stringify(readData)}</div>
      </div>
      {/* <div>
        {!readData
          ? null
          : readData.map((dataRow, i) => <div key={i}>dataRow</div>)}
      </div> */}
    </Layout>
  );
}
