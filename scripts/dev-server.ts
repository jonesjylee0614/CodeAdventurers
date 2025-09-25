type ApiModule = typeof import('../services/api/src/index');

async function loadApi(): Promise<ApiModule> {
  const apiModuleUrl = new URL('../services/api/src/index.ts', import.meta.url);
  return import(apiModuleUrl.href) as Promise<ApiModule>;
}

const port = Number(process.env.PORT ?? 3000);

async function main() {
  const { createServer } = await loadApi();
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
