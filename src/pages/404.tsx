import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';
import TextLink from '../components/text-link';

type Props = {
  path: string;
};

const NotFoundPage = ({ path }: Props) => (
  <Layout path={path}>
    <SEO title="404: Not found" />
    <h1 className="mt-20">Oh no, couldn't find this page!</h1>
    <TextLink href="/">Back to safety</TextLink>
  </Layout>
);

export default NotFoundPage;
