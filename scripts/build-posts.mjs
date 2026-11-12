import { buildPosts } from './posts.mjs';

try {
  const posts = await buildPosts();
  console.log(`Bitácora: ${posts.length} artículos generados en dist/posts.js.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
