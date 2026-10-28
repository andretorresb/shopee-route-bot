import 'dotenv/config';
import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { RouteDatabase } from './database.js';
import { EvolutionClient } from './evolution-client.js';
import { RouteProcessor } from './processor.js';

const config = loadConfig();
const database = new RouteDatabase();
const evolution = new EvolutionClient(process.env.EVOLUTION_API_URL ?? 'http://localhost:8080', process.env.EVOLUTION_API_KEY ?? '', config.evolution.instance);
const processor = new RouteProcessor(config, database, evolution);
const app = Fastify({ logger: true });
const adminGuard = async (request: any, reply: any) => {
  const expected = process.env.ADMIN_TOKEN;
  if (expected && request.headers.authorization !== `Bearer ${expected}`) return reply.code(401).send({ error: 'unauthorized' });
};

app.get('/health', async () => ({ ok: true, enabled: config.enabled, simulation: config.simulation }));
app.post('/webhooks/evolution', async (request, reply) => {
  const body = request.body as any;
  const event = String(body?.event ?? '').toUpperCase();
  if (event && event !== 'MESSAGES_UPSERT') return { accepted: true, ignored: event };
  return { accepted: true, result: await processor.process(body) };
});
app.get('/admin/connection', { onRequest: adminGuard }, async () => evolution.connection());
app.get('/admin/connect', { onRequest: adminGuard }, async () => evolution.connect());
app.get('/admin/groups', { onRequest: adminGuard }, async () => evolution.groups());
app.get('/admin/evolution-version', { onRequest: adminGuard }, async () => evolution.version());
app.get('/admin/history', { onRequest: adminGuard }, async () => database.list());
app.post('/admin/webhook', { onRequest: adminGuard }, async () => evolution.setWebhook(process.env.WEBHOOK_PUBLIC_URL ?? ''));

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: process.env.HOST ?? '0.0.0.0' }).catch((error) => { app.log.error(error); process.exit(1); });
