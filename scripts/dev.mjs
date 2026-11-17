import { buildPosts, watchPosts } from './posts.mjs';
import { buildCV, watchCV } from './cv.mjs';
import { startServer } from './serve.mjs';

const watchers = [];
const closeWatchers = () => Promise.all(watchers.map(close => close()));
try {
  await buildCV();
  await buildPosts();
  watchers.push(watchPosts({
    onBuild: posts => console.log(`Bitácora actualizada: ${posts.length} artículos. Recargá el navegador.`),
    onError: error => console.error(`No se actualizó la bitácora: ${error.message}`),
  }));
  watchers.push(watchCV({
    onBuild: profile => console.log(`CV actualizado: ${profile.source.filename}. Recargá el navegador.`),
    onError: error => console.error(`No se actualizó el CV: ${error.message}`),
  }));
  const server = startServer();
  server.on('error', closeWatchers);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
    await closeWatchers();
    server.close();
  });
} catch (error) {
  await closeWatchers();
  console.error(error.message);
  process.exitCode = 1;
}
