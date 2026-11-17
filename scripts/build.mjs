import { buildPosts } from './posts.mjs';
import { buildCV } from './cv.mjs';

try {
  const profile = await buildCV();
  console.log(`CV: ${profile.source.filename}, ${profile.sections.length} secciones generadas en dist/content.js.`);
  const posts = await buildPosts();
  console.log(`Bitácora: ${posts.length} artículos generados en dist/posts.js.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
