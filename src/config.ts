import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  shopeeId: z.string().min(1),
  evolution: z.object({ instance: z.string().min(1) }),
  groups: z.array(z.object({ id: z.string().min(1), name: z.string().optional(), responsible: z.string().min(6) })),
  acceptedNeighborhoods: z.array(z.string().min(1)),
  keywords: z.array(z.string().min(1)).default(['disponível', 'disponivel']),
  enabled: z.boolean().default(false),
  simulation: z.boolean().default(true)
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(file = process.env.CONFIG_PATH ?? './config.json'): AppConfig {
  const absolute = path.resolve(file);
  return schema.parse(JSON.parse(fs.readFileSync(absolute, 'utf8')));
}
