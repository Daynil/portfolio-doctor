import chalk from 'chalk';
import { generateSitemap } from './generate-sitemap';
// import { processAllImages } from './process-images';

// Running all build tasks in a script allows me to choose
// when they are all run in a command, vs. in webpack
// where they are are all always run
let start = new Date();
// console.info(chalk.cyan('Processing images...'));
// processAllImages();
// console.info(chalk.cyan(`Images processed in ${+new Date() - +start}ms`));
start = new Date();
console.info(chalk.cyan('Generating sitemap...'));
generateSitemap();
console.info(chalk.cyan(`Sitemap generated in ${+new Date() - +start}ms`));
