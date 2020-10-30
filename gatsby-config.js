const path = require('path');

module.exports = {
  siteMetadata: {
    siteUrl: 'https://portfoliodoctor.com',
    title: 'Portfolio Doctor',
    description: 'An app for projecting portfolio performance',
    author: 'Danny Libin'
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-sitemap',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'assets',
        path: `${__dirname}/src/content/assets`
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'posts',
        path: `${__dirname}/src/content/posts`
      }
    },
    {
      resolve: 'gatsby-plugin-mdx'
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    // {
    //   resolve: `gatsby-plugin-google-analytics`,
    //   options: {
    //     // The property ID; the tracking code won't be generated without it
    //     trackingId: 'UA-163290364-1',
    //     // Defines where to place the tracking script - `true` in the head and `false` in the body
    //     head: false
    //     // Avoids sending pageview hits from custom paths
    //     //exclude: ["/preview/**", "/do-not-track/me/too/"],
    //     // Delays sending pageview hits on route update (in milliseconds)
    //     //pageTransitionDelay: 0,
    //   }
    // },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'gatsby-starter-default',
        short_name: 'starter',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: 'src/content/assets/images/logo.png' // This path is relative to the root of the site.
      }
    },
    {
      resolve: 'gatsby-plugin-postcss',
      options: {
        postCssPlugins: [
          require(`tailwindcss`),
          ...(process.env.NODE_ENV === 'production'
            ? [require(`autoprefixer`), require(`cssnano`)]
            : [])
        ]
      }
    },
    {
      resolve: `gatsby-plugin-purgecss`,
      options: {
        tailwind: true,
        content: [
          path.join(process.cwd(), 'src/**/!(*.d).{ts,js,jsx,tsx,md,mdx}')
        ]
        //purgeOnly: [`src/css/style.css`]
      }
    }
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ]
};
