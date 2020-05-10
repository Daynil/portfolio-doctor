import React from 'react';
import './blog-post.css';

type Props = {
  path: string;
  //data: BlogPostBySlugQuery;
  pageContext: {
    slug: string;
  };
};

const BlogPost = (props: Props) => {
  return <div>Blog post placeholder!</div>;
  // const { excerpt, body, frontmatter, timeToRead } = props.data.mdx;
  // const { featuredImage } = props.data;
  // // const { previous, next } = props.pageContext;

  // const twitterShareUrl = `https://twitter.com/share?url=https://questsincode.com${props.pageContext.slug}&text=“${frontmatter.title}”, a post from Danny Libin.&via=Dayn1l`;

  // const postTags = !frontmatter.tags.length
  //   ? null
  //   : frontmatter.tags.map((tag, index) => (
  //       <Link key={index} to={`/topics?topic=${tag}`} className="my-1">
  //         <span
  //           className={
  //             'py-1 px-4 ml-4 text-sm font-semibold tracking-widest rounded-full cursor-pointer transition duration-200 ease-in-out bg-green-100 text-green-700 hover:bg-green-200 dk:bg-blue-900 dk:text-green-100 dk-hover:bg-blue-700'
  //           }
  //         >
  //           {tag}
  //         </span>
  //       </Link>
  //     ));

  // return (
  //   <MDXProvider
  //     components={{
  //       a: TextLink
  //     }}
  //   >
  //     <Layout path={props.path}>
  //       <SEO
  //         title={frontmatter.title}
  //         description={frontmatter.description || excerpt}
  //         featuredImage={featuredImage.childImageSharp.fluid.originalImg || ''}
  //       />
  //       <div className="mt-24">
  //         <div className="text-center">
  //           <div className="flex flex-wrap justify-center">{postTags}</div>
  //           <h1 className="my-2">{frontmatter.title}</h1>
  //           <div className="mb-8 text-gray-700 dk:text-gray-500 flex justify-center flex-col sm:flex-row sm:text-center">
  //             <span className="mr-2">
  //               {frontmatter.date}{' '}
  //               <span className="hidden sm:inline-block">•</span>{' '}
  //             </span>
  //           </div>
  //         </div>
  //         <div className="w-full">
  //           <Image
  //             className="z-0 rounded-md"
  //             fluid={featuredImage.childImageSharp.fluid}
  //             alt={frontmatter.title}
  //           />
  //         </div>
  //         <div className="mt-20">
  //           <MDXRenderer>{body}</MDXRenderer>
  //         </div>
  //         <a
  //           href={twitterShareUrl}
  //           target="_blank"
  //           className="flex flex-row mt-12"
  //         >
  //           <TwitterIcon className="text-green-500 hover:text-green-300 transition-colors ease-in-out duration-300 w-24" />
  //           <span className="ml-4 p-4 bg-green-200 dk:bg-green-800 text-green-800 dk:text-green-200 text-2xl rounded-md">
  //             Found this article useful? Please click share it to spread the
  //             word!! 🎉
  //           </span>
  //         </a>
  //       </div>
  //     </Layout>
  //   </MDXProvider>
  // );
};

// export const query = graphql`
//   query BlogPostBySlug($slug: String!, $featuredImage: String!) {
//     mdx(fields: { slug: { eq: $slug } }) {
//       body
//       excerpt(pruneLength: 160)
//       timeToRead
//       frontmatter {
//         title
//         tags
//         date(formatString: "MMMM DD, YYYY")
//         description
//       }
//     }
//     featuredImage: file(absolutePath: { regex: $featuredImage }) {
//       childImageSharp {
//         fluid {
//           ...GatsbyImageSharpFluid
//           originalImg
//         }
//       }
//     }
//   }
// `;

export default BlogPost;
