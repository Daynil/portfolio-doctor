import { format } from 'd3-format';
import React, { useContext, useEffect, useRef, useState } from 'react';
import SEO from '../components/seo';
import { MarketYearData } from '../data/calc/portfolio-calc';
import { DatasetContext, defaultDatasetName } from '../data/data-context';
import { loadFile, parseCSVStringToJSON } from '../data/data-helpers';

export default function UploadData() {
  const fileInput = useRef<HTMLInputElement>(null);

  const [inputErr, setInputErr] = useState('');

  const {
    preferredDataset,
    setPreferredDataset,
    storedDatasets,
    setStoredDatasets,
    defaultDatasetCSVStringCache
  } = useContext(DatasetContext);

  function getDataset(datasetName: string): MarketYearData[] {
    if (datasetName === defaultDatasetName) {
      if (!defaultDatasetCSVStringCache) return [];
      return parseCSVStringToJSON(defaultDatasetCSVStringCache);
    } else {
      return parseCSVStringToJSON(
        storedDatasets.find((d) => d.name === datasetName).csvString
      );
    }
  }

  const [readData, setReadData] = useState<MarketYearData[]>();

  // When preferred dataset has changed
  useEffect(() => {
    setReadData(getDataset(preferredDataset));
  }, [preferredDataset]);

  // When default dataset first loads
  useEffect(() => {
    if (preferredDataset === defaultDatasetName) {
      setReadData(getDataset(defaultDatasetName));
    }
  }, [defaultDatasetCSVStringCache]);

  const [selectedDatasetName, setSelectedDatasetName] = useState(
    defaultDatasetName
  );

  function handleSetActive() {
    setPreferredDataset(selectedDatasetName);
  }

  function handleRemoveDataset() {
    const selectedDatasetIdx = storedDatasets.findIndex(
      (d) => d.name === selectedDatasetName
    );

    if (selectedDatasetName === preferredDataset) {
      setPreferredDataset(defaultDatasetName);
    }

    setSelectedDatasetName(defaultDatasetName);

    storedDatasets.splice(selectedDatasetIdx, 1);

    setStoredDatasets(storedDatasets);
  }

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

    setStoredDatasets(newDatasets);
    setReadData(parseCSVStringToJSON(fileData));
    setPreferredDataset(uploadedFile.name);
    fileInput.current.value = '';

    setInputErr('');
  }

  return (
    <div>
      <SEO title="About - FI Portfolio Doctor" />
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
        <li>
          <b>Year:</b> YYYY integer
        </li>
        <li>
          <b>Equities Price:</b> float
        </li>
        <li>
          <b>Dividend Per Equity Share:</b> float
        </li>
        <li>
          <b>Inflation Index:</b> float
        </li>
        <li>
          <b>Fixed Income Interest:</b> float, in percent
        </li>
      </ul>
      <div className="flex flex-col mt-8">
        <label className="form-label" htmlFor="preferredDataset">
          Available dataset files
        </label>
        <select
          name="preferredDataset"
          id="preferredDataset"
          className="rounded-md shadow-sm bg-gray-100 border-gray-300 transition-colors duration-75 hover:border-green-300 focus:bg-transparent focus:border-green-400 focus:ring focus:ring-green-300 focus:ring-opacity-50"
          onChange={(e) => setSelectedDatasetName(e.target.value)}
        >
          {storedDatasets.map((dataset, i) => (
            <option key={i} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>
        <div className="flex mt-4">
          <button
            className="btn btn-green"
            disabled={preferredDataset === selectedDatasetName}
            onClick={() => handleSetActive()}
          >
            Set Active
          </button>
          <button
            className="btn btn-green ml-4"
            disabled={selectedDatasetName === defaultDatasetName}
            onClick={() => handleRemoveDataset()}
          >
            Remove
          </button>
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
          className="rounded-md shadow-sm p-2 bg-gray-100 border-gray-300 transition-colors duration-75 hover:border-green-300 focus:bg-transparent focus:border-green-400 focus:ring focus:ring-green-300 focus:ring-opacity-50"
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
        <div className="text-lg font-bold text-green-500">
          {preferredDataset}
        </div>
      </div>
      <div>
        <table className="mt-4 border-collapse">
          <tr className="bg-green-500 text-white text-right">
            <th className="p-2">Year</th>
            <th className="p-2">Equities Price</th>
            <th className="p-2">Dividend Per Equity Share</th>
            <th className="p-2">Inflation Index</th>
            <th className="p-2">Fixed Income Interest</th>
          </tr>
          {!readData
            ? null
            : readData.map((dataRow, i) => {
                return (
                  <tr
                    key={i + 1}
                    className="group transition-colors even:bg-gray-200"
                  >
                    <td className="group-hover:bg-gray-400 duration-200 text-right">
                      {dataRow.year}
                    </td>
                    <td className="group-hover:bg-gray-400 duration-200 text-right">
                      {format('$.2f')(dataRow.equitiesPrice)}
                    </td>
                    <td className="group-hover:bg-gray-400 duration-200 text-right">
                      {format('$.2f')(dataRow.equitiesDividend)}
                    </td>
                    <td className="group-hover:bg-gray-400 duration-200 text-right">
                      {format('$.2f')(dataRow.inflationIndex)}
                    </td>
                    <td className="group-hover:bg-gray-400 duration-200 text-right">
                      {format('.2%')(dataRow.fixedIncomeInterest / 100)}
                    </td>
                  </tr>
                );
              })}
        </table>
      </div>
    </div>
  );
}
