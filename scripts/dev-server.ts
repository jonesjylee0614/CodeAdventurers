import { createServer } from '../services/api/src/index.js';

declare const process: {
  env: Record<string, string | undefined>;
  exitCode: number;
};

const port = Number(process.env.PORT ?? 3000);

async function main() {
  const { app } = await createServer();
  app.listen(port, () => {
    console.log(`[dev] API server listening on http://localhost:${port}`);
    console.log('[dev] Available endpoints:');
    console.log(`  - 学生端: http://localhost:${port}/student`);
    console.log(`  - 教师端: http://localhost:${port}/teacher`);
    console.log(`  - 家长端: http://localhost:${port}/parent`);
    console.log(`  - 管理端: http://localhost:${port}/admin`);
    console.log(`  - API接口: http://localhost:${port}/api`);
    console.log('[dev] Press Ctrl+C to stop the server.');
  });
}

main().catch((error) => {
  console.error('[dev] Failed to start API server:', error);
  process.exitCode = 1;
});
