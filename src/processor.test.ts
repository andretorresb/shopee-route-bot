import { describe, expect, it, vi } from 'vitest';
import { RouteDatabase } from './database.js';
import { RouteProcessor } from './processor.js';

const payload = (id: string, text = 'Cuiabá Cristo Rei DISPONÍVEL') => ({ event: 'MESSAGES_UPSERT', data: { key: { id, remoteJid: '123@g.us', fromMe: false }, message: { conversation: text } } });

describe('RouteProcessor', () => {
  it('is idempotent and does not send in simulation', async () => {
    const db = new RouteDatabase(':memory:');
    const evolution = { sendText: vi.fn() } as any;
    const processor = new RouteProcessor({ shopeeId: '3679118', evolution: { instance: 'x' }, groups: [{ id: '123@g.us', responsible: '5565999999999' }], acceptedNeighborhoods: ['Cristo Rei'], keywords: ['disponível'], enabled: true, simulation: true }, db, evolution);
    expect((await processor.process(payload('a'))).status).toBe('simulation');
    expect((await processor.process(payload('a'))).status).toBe('duplicate');
    expect(evolution.sendText).not.toHaveBeenCalled();
  });

  it('records a send failure', async () => {
    const db = new RouteDatabase(':memory:');
    const evolution = { sendText: vi.fn().mockRejectedValue(new Error('offline')) } as any;
    const processor = new RouteProcessor({ shopeeId: '1', evolution: { instance: 'x' }, groups: [{ id: '123@g.us', responsible: '5565999999999' }], acceptedNeighborhoods: ['Cristo Rei'], keywords: ['disponível'], enabled: true, simulation: false }, db, evolution);
    expect((await processor.process(payload('b'))).status).toBe('failed');
    expect(db.list()[0].status).toBe('failed');
  });
});
