import React from 'react';
import SEO from '../components/seo';

export default function Home() {
  return (
    <div>
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
    </div>
  );
}
