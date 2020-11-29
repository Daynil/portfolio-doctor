import { AppProps } from 'next/app';
import Layout from '../components/layout';
import DatasetContextProvider from '../data/data-context';
import '../styles/global.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DatasetContextProvider>
      <Layout>
        {' '}
        <Component {...pageProps} />
      </Layout>
    </DatasetContextProvider>
  );
}
