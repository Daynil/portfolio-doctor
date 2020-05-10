import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

type Props = {
  path: string;
};

export default ({ path }: Props) => (
  <Layout path={path}>
    <SEO
      title="Portfolio Doctor"
      description="An app for projecting portfolio performance"
    />
    <div className="mt-20 text-center">
      <h2 className="text-3xl">Simulate your portfolio's performance</h2>
      <p className="-mt-4">
        Input some information about your portfolio and see how it's likely to
        do over the years!
      </p>
    </div>
    <div>Homepage!</div>
  </Layout>
);
