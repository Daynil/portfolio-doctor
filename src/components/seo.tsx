import Head from 'next/head';
import React from 'react';

type Props = {
  title: string;
} & typeof defaultProps;

const defaultProps = {
  lang: 'en',
  description: '',
  featuredImagePath: '',
  index: false
};

SEO.defaultProps = defaultProps;

export default function SEO({
  description,
  lang,
  title,
  featuredImagePath,
  index
}: Props) {
  const metaDescription =
    description || 'An app for projecting portfolio performance';

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="Danny Libin" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
    </Head>
  );
}
