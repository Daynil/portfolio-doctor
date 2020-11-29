import React from 'react';
import SEO from '../components/seo';
import TextLink from '../components/text-link';

export default function About() {
  return (
    <div>
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
    </div>
  );
}
