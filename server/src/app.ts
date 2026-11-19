import { randomUUID } from 'node:crypto';
import Fastify, {
  LogController,
  type FastifyError,
  type FastifyReply,
  type FastifyServerOptions,
} from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ErrorResponse,
  EventsResponse,
  ServiceResponse,
  ServicesResponse,
  deriveOverallStatus,
} from '@ssd/shared';
import type { StatusRepository } from './repository/types';

export const REQUEST_ID_HEADER = 'x-request-id';
/** Accept a caller's request ID (to trace across services) only if it looks safe to log. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

const HealthResponse = z.object({
  status: z.enum(['ok', 'degraded']),
  lastPollAt: z.iso.datetime().nullable(),
});

export interface AppDependencies {
  repository: StatusRepository;
  /** When the poller last completed a round; null before the first one. */
  getLastPollAt: () => Date | null;
  staleAfterMs: number;
  /** Sent to clients with the services so they follow the server's timing. */
  pollIntervalMs: number;
  now?: () => Date;
  logger?: FastifyServerOptions['logger'];
}

export function buildApp(deps: AppDependencies) {
  const now = deps.now ?? (() => new Date());

  const app = Fastify({
    logger: deps.logger ?? false,
    logController: new LogController({ requestIdLogLabel: 'requestId' }),
    genReqId: (req) => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      return typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming)
        ? incoming
        : randomUUID();
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Return the request ID on every response so users and operators can quote it when reporting issues.
  app.addHook('onRequest', async (req, reply) => {
    reply.header(REQUEST_ID_HEADER, req.id);
  });

  const sendError = (reply: FastifyReply, statusCode: number, code: string, message: string) =>
    reply.code(statusCode).send({ error: { code, message, requestId: String(reply.request.id) } });

  app.setNotFoundHandler((req, reply) =>
    sendError(reply, 404, 'NOT_FOUND', `Route ${req.method} ${req.url} not found`),
  );

  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return sendError(reply, 400, 'VALIDATION_ERROR', error.message);
    }
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    if (statusCode >= 500) req.log.error({ err: error }, 'unhandled error');
    return sendError(
      reply,
      statusCode,
      statusCode >= 500 ? 'INTERNAL_ERROR' : (error.code ?? 'BAD_REQUEST'),
      statusCode >= 500 ? 'Internal server error' : error.message,
    );
  });

  /** Health of the dashboard itself: unhealthy if the poller hasn't completed a round recently. */
  app.get(
    '/health',
    { schema: { response: { 200: HealthResponse, 503: HealthResponse } } },
    async (_req, reply) => {
      const lastPollAt = deps.getLastPollAt();
      const healthy =
        lastPollAt !== null && now().getTime() - lastPollAt.getTime() <= deps.staleAfterMs;
      return reply.code(healthy ? 200 : 503).send({
        status: healthy ? 'ok' : 'degraded',
        lastPollAt: lastPollAt?.toISOString() ?? null,
      });
    },
  );

  app.get('/api/services', { schema: { response: { 200: ServicesResponse } } }, async () => {
    const at = now();
    const services = await deps.repository.listServices(at);
    return {
      overall: deriveOverallStatus(services),
      services,
      generatedAt: at.toISOString(),
      staleAfterMs: deps.staleAfterMs,
      pollIntervalMs: deps.pollIntervalMs,
    };
  });

  app.get(
    '/api/services/:id',
    {
      schema: {
        params: z.object({ id: z.string().min(1).max(64) }),
        response: { 200: ServiceResponse, 404: ErrorResponse },
      },
    },
    async (req, reply) => {
      const service = await deps.repository.getService(req.params.id, now());
      if (!service) {
        return sendError(reply, 404, 'SERVICE_NOT_FOUND', `No service with id "${req.params.id}"`);
      }
      return { service };
    },
  );

  app.get(
    '/api/events',
    {
      schema: {
        querystring: z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }),
        response: { 200: EventsResponse },
      },
    },
    async (req) => ({ events: await deps.repository.listEvents(req.query.limit) }),
  );

  return app;
}
