import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';
import TextLink from '../components/text-link';

type Props = {
  path: string;
};

const About = ({ path }: Props) => (
  <Layout path={path}>
    <SEO title="About - Portfolio Doctor" />
    <h1 className="mt-20 text-center">About Portfolio Doctor</h1>
    <p>
      Portfolio doctor is an app to simulate possible future portfolio
      performance over time.
    </p>
    <p>
      Written and created by{' '}
      <TextLink href="https://dlibin.net">Danny Libin</TextLink>.
    </p>
  </Layout>
);

export default About;
