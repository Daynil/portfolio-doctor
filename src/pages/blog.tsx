import React from 'react';
// import { PostsIndexPostsQuery } from '../../graphql-types';
import Layout from '../components/layout';
import SEO from '../components/seo';

type Props = {
  path: string;
  //data: any; //PostsIndexPostsQuery;
};

export default ({ path }: Props) => (
  <Layout path={path}>
    <SEO title="Blog - Portfolio Doctor" />
    <div>No posts yet</div>
    {/* <div className="mt-20">
      {data.allMdx.edges.map(({ node }, index) => {
        const postTags = !node.frontmatter.tags.length
          ? null
          : node.frontmatter.tags.map((tag, index) => (
              <Link key={index} to={`/topics?topic=${tag}`} className="my-1">
                <span
                  className={
                    'py-1 px-4 text-sm font-semibold tracking-widest rounded-full cursor-pointer transition duration-200 ease-in-out bg-green-100 text-green-700 hover:bg-green-200 dk:bg-blue-900 dk:text-green-100 dk-hover:bg-blue-700' +
                    (index >= 1 ? ' ml-4' : '')
                  }
                >
                  {tag}
                </span>
              </Link>
            ));

        return (
          <div className="mt-12" key={index}>
            <div className="mb-4 flex flex-wrap">{postTags}</div>
            <Link to={node.fields.slug}>
              <h2 className="my-2">{node.frontmatter.title}</h2>
              <div className="mb-8 text-gray-700 dk:text-gray-500 flex flex-col sm:flex-row sm:text-center">
                <span className="mr-2">
                  {node.frontmatter.date}{' '}
                  <span className="hidden sm:inline-block">•</span>{' '}
                </span>
              </div>
              <p className="-mt-2">
                {node.frontmatter.description
                  ? node.frontmatter.description
                  : node.excerpt}
              </p>
            </Link>
          </div>
        );
      })}
    </div> */}
  </Layout>
);

// export const query = graphql`
//   query PostsIndexPosts {
//     allMdx {
//       edges {
//         node {
//           excerpt
//           timeToRead
//           frontmatter {
//             date(formatString: "MMMM DD, YYYY")
//             description
//             title
//             tags
//           }
//           fields {
//             slug
//           }
//         }
//       }
//     }
//   }
// `;
