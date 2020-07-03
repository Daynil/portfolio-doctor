const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');
const fs = require('fs');

// /** @type { import("gatsby").GatsbyNode["createPages"] } */
// exports.createPages = async ({ graphql, actions }) => {
//   const { createPage } = actions;

//   const mdxPages = await graphql(`
//     query AllMdxPages {
//       allMdx(sort: { fields: [frontmatter___date], order: DESC }) {
//         edges {
//           node {
//             excerpt
//             timeToRead
//             frontmatter {
//               date(formatString: "MMMM DD, YYYY")
//               description
//               title
//               tags
//             }
//             fields {
//               slug
//             }
//           }
//         }
//       }
//     }
//   `);

//   // Create a page for each post
//   const posts = mdxPages.data.allMdx.edges;
//   posts.forEach((post, index) => {
//     const previous = index === posts.length - 1 ? null : posts[index + 1].node;
//     const next = index === 0 ? null : posts[index - 1].node;
//     createPage({
//       path: post.node.fields.slug,
//       component: path.resolve('./src/components/blog-post/blog-post.tsx'),
//       context: {
//         slug: post.node.fields.slug,
//         featuredImage: `${post.node.fields.slug}featuredImage.png/`,
//         previous,
//         next
//       }
//     });
//   });
// };

// /** @type { import("gatsby").GatsbyNode["onCreateNode"] } */
// exports.onCreateNode = async ({ node, getNode, actions }) => {
//   const { createNodeField } = actions;
//   if (node.internal.type === 'Mdx') {
//     const slug = createFilePath({ node, getNode });
//     createNodeField({
//       node,
//       name: 'slug',
//       value: `/blog${slug}`
//     });
//   }
// };

/** @type { import("gatsby").GatsbyNode["onCreateWebpackConfig"] } */
exports.onCreateWebpackConfig = ({ stage, actions }) => {
  // For debugging purposes
  if (process.env.NODE_ENV === 'development') {
    actions.setWebpackConfig({
      devtool: 'eval-source-map'
    });
  }
  /**
   * First: $ yarn add --dev @hot-loader/react-dom
   * Fixes react hot loader warning
   * https://github.com/gatsbyjs/gatsby/issues/11934
   */
  if (stage.startsWith('develop')) {
    actions.setWebpackConfig({
      resolve: {
        alias: {
          'react-dom': '@hot-loader/react-dom'
        }
      }
    });
  }
};
