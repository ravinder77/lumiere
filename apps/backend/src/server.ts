import 'dotenv/config';
import { createApp } from './app/createApp';

const app = createApp();
const PORT = process.env.PORT || 4000;

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Server:  http://localhost:${PORT}`);
  console.log(`📦  API:     http://localhost:${PORT}/api`);
  console.log(`🩺  Health:  http://localhost:${PORT}/health`);
  console.log(`✅  Ready:   http://localhost:${PORT}/ready`);
  console.log(`📈  Metrics: http://localhost:${PORT}/metrics\n`);
});

export default app;
