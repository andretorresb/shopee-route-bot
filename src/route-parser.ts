export type ParsedRoute = { neighborhood: string; originalText: string };

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function parseRoute(text: string, neighborhoods: string[], keywords: string[]): ParsedRoute | null {
  const clean = text.trim();
  if (!clean) return null;
  const normalized = normalize(clean);
  if (!keywords.some((keyword) => normalized.includes(normalize(keyword)))) return null;

  const match = neighborhoods
    .map((neighborhood) => ({ neighborhood, value: normalize(neighborhood) }))
    .sort((a, b) => b.value.length - a.value.length)
    .find(({ value }) => normalized.includes(value));
  return match ? { neighborhood: match.neighborhood, originalText: clean } : null;
}

export function extractText(message: any): string {
  return message?.conversation ?? message?.extendedTextMessage?.text ?? message?.imageMessage?.caption ?? message?.videoMessage?.caption ?? '';
}
