import React, { useRef, useState } from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { MarketYearData } from '../data/calc/portfolio-calc';
import { parseCSVFileToJSON } from '../data/data-helpers';

type Props = {
  path: string;
};

export default function UploadData({ path }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [readData, setReadData] = useState<MarketYearData[]>(null);

  async function handleFileInput(f) {
    setReadData(await parseCSVFileToJSON(fileInput.current.files[0]));
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
      <p>Select a CSV file to use:</p>
      <input
        type="file"
        id="csv"
        name="csv"
        accept=".csv"
        onChange={(f) => handleFileInput(f)}
        ref={fileInput}
      />
      <div>{JSON.stringify(readData)}</div>
      {/* <div>
        {!readData
          ? null
          : readData.map((dataRow, i) => <div key={i}>dataRow</div>)}
      </div> */}
    </Layout>
  );
}
