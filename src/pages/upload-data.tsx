import React, { useRef } from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

type Props = {
  path: string;
};

export default function UploadData({ path }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFileInput(f) {
    console.log(fileInput.current.files[0].name);
    console.log(URL.createObjectURL(fileInput.current.files[0]));
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
    </Layout>
  );
}
