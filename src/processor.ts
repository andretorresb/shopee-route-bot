import type { AppConfig } from './config.js';
import { RouteDatabase } from './database.js';
import { EvolutionClient } from './evolution-client.js';
import { extractText, parseRoute } from './route-parser.js';

export class RouteProcessor {
  constructor(private readonly config: AppConfig, private readonly database: RouteDatabase, private readonly evolution: EvolutionClient) {}
  async process(payload: any): Promise<{ status: string; reason?: string }> {
    const data = payload?.data ?? payload;
    const key = data?.key ?? {};
    const messageId = key.id;
    const groupId = key.remoteJid;
    if (!messageId || !groupId?.endsWith('@g.us')) return { status: 'ignored', reason: 'not-a-group-message' };
    if (key.fromMe || data?.message?.key?.fromMe) return { status: 'ignored', reason: 'from-me' };
    const group = this.config.groups.find((item) => item.id === groupId);
    if (!group) return { status: 'ignored', reason: 'group-not-allowed' };
    if (this.database.has(messageId)) return { status: 'duplicate' };
    const originalMessage = extractText(data.message ?? data);
    const route = parseRoute(originalMessage, this.config.acceptedNeighborhoods, this.config.keywords);
    if (!route) return { status: 'ignored', reason: 'not-a-route' };
    const record = { messageId, originalMessage, groupId, neighborhood: route.neighborhood, receivedAt: new Date().toISOString(), recipient: group.responsible, status: this.config.simulation ? 'simulation' as const : 'failed' as const };
    this.database.insert(record);
    if (!this.config.enabled || this.config.simulation) return { status: this.config.simulation ? 'simulation' : 'disabled' };
    try {
      const quoted = { key, message: data.message };
      try {
        await this.evolution.sendText(group.responsible, `${route.neighborhood} ${this.config.shopeeId}`, quoted);
      } catch (quotedError) {
        await this.evolution.sendText(group.responsible, originalMessage);
        await this.evolution.sendText(group.responsible, `${route.neighborhood} ${this.config.shopeeId}`);
      }
      this.database.updateStatus(messageId, 'sent');
      return { status: 'sent' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.database.updateStatus(messageId, 'failed', message);
      return { status: 'failed', reason: message };
    }
  }
}
