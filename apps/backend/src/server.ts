import 'dotenv/config';
import './telemetry';
import { createApp } from './app/createApp';
import logger from './lib/logger';

const app = createApp();
const PORT = process.env.PORT || 4000;

// ── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      urls: {
        server: `http://localhost:${PORT}`,
        api: `http://localhost:${PORT}/api`,
        health: `http://localhost:${PORT}/health`,
        ready: `http://localhost:${PORT}/ready`,
      },
    },
    'Server started'
  );
});

server.on('error', (err) => {
  logger.error({ err }, 'Server failed');
});

export default app;
