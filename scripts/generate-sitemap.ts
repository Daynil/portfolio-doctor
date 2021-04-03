import fs from 'fs';
import globby from 'globby';
import prettier from 'prettier';

const pathToPages = 'src/pages';
const pathToPosts = 'src/_posts';

/**
 * Generate sitemap for every navigable route.
 * Based on Nextjs Pages folder, and markdown post files
 */
export async function generateSitemap() {
  const pages = await globby([
    `${pathToPages}/**/*.{tsx,jsx,ts,js}`,
    `!${pathToPages}/_*.{tsx,jsx,ts,js}`,
    `!${pathToPages}/404.{tsx,jsx,ts,js}`,
    `!${pathToPages}/posts/*`,
    `${pathToPosts}/*.{md,mdx}`
  ]);
  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map((page) => {
          const path = page
            .replace(/\.mdx|\.md|\.tsx|\.jsx|\.ts|\.ts/gm, '')
            .replace(pathToPosts, 'posts')
            .replace(`${pathToPages}/`, '');
          const route = path === 'index' ? '' : `${path}/`;
          return `
          <url>
            <loc>https://fiportfoliodoc.com/${route}</loc>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
          </url>
        `;
        })
        .join('')}
    </urlset>
  `;
  const formattedSitemap = prettier.format(sitemap, {
    ...(await prettier.resolveConfig('./.prettierrc')),
    parser: 'html'
  });
  fs.writeFileSync('public/sitemap.xml', formattedSitemap);
}

generateSitemap();
