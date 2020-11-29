import React from 'react';
import SEO from '../components/seo';
import TextLink from '../components/text-link';

export default function NotFoundPage() {
  return (
    <div>
      <SEO title="404: Not found" />
      <h1 className="mt-20">Oh no, couldn't find this page!</h1>
      <TextLink href="/">Back to safety</TextLink>
    </div>
  );
}
