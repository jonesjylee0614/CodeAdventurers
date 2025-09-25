import { createServer } from '../services/api/src/index.js';

const port = Number(process.env.PORT ?? 3000);

async function main() {
  const { app } = await createServer();
  app.listen(port, () => {
    console.log(`[dev] API server listening on http://localhost:${port}`);
    console.log('[dev] Press Ctrl+C to stop the server.');
  });
}

main().catch((error) => {
  console.error('[dev] Failed to start API server:', error);
  process.exitCode = 1;
});
