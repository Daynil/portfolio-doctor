import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import { Helmet } from 'react-helmet';
import { SeoMetadataQuery } from '../../graphql-types';

type Props = {
  title: string;
} & typeof defaultProps;

const defaultProps = {
  lang: 'en',
  meta: [],
  description: '',
  featuredImage: ''
};

const SEO = ({ description, lang, meta, title, featuredImage }: Props) => {
  const { site } = useStaticQuery<SeoMetadataQuery>(
    graphql`
      query SEOMetadata {
        site {
          siteMetadata {
            title
            description
            author
            siteUrl
          }
        }
      }
    `
  );

  const metaDescription = description || site.siteMetadata.description;

  if (featuredImage) {
    meta.push(
      {
        property: 'og:image',
        content: `${site.siteMetadata.siteUrl}${featuredImage}`
      },
      {
        name: 'twitter:image',
        content: `${site.siteMetadata.siteUrl}${featuredImage}`
      }
    );
  }

  return (
    <Helmet
      htmlAttributes={{
        lang
      }}
      title={title}
      titleTemplate={`%s | ${site.siteMetadata.title}`}
      meta={[
        {
          name: 'description',
          content: metaDescription
        },
        {
          property: 'og:title',
          content: title
        },
        {
          property: 'og:description',
          content: metaDescription
        },
        {
          property: 'og:type',
          content: 'website'
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:creator',
          content: site.siteMetadata.author
        },
        {
          name: 'twitter:title',
          content: title
        },
        {
          name: 'twitter:description',
          content: metaDescription
        }
      ].concat(meta)}
    />
  );
};
SEO.defaultProps = defaultProps;

export default SEO;
