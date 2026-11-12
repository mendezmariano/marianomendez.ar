import { buildPosts, watchPosts } from './posts.mjs';
import { startServer } from './serve.mjs';

try {
  await buildPosts();
  const closeWatcher = watchPosts({
    onBuild: posts => console.log(`Bitácora actualizada: ${posts.length} artículos. Recargá el navegador.`),
    onError: error => console.error(`No se actualizó la bitácora: ${error.message}`),
  });
  const server = startServer();
  server.on('error', () => closeWatcher());
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
    await closeWatcher();
    server.close();
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
