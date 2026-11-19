import Fastify from 'fastify';

// Placeholder entry point; the real app (poller, repository, routes) arrives in phase 3.
const port = Number(process.env.PORT ?? 3000);
const isDev = process.env.NODE_ENV !== 'production';

const app = Fastify({
  logger: isDev
    ? {
        level: 'info',
        transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } },
      }
    : { level: 'info' },
});

app.get('/health', async () => ({ status: 'ok' }));

await app.listen({ port, host: '0.0.0.0' });
