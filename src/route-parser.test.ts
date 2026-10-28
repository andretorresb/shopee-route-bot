import { describe, expect, it } from 'vitest';
import { parseRoute } from './route-parser.js';

describe('parseRoute', () => {
  const neighborhoods = ['Cristo Rei', 'Paiaguás', 'Jardim Vitória'];
  it('recognizes accented availability text', () => expect(parseRoute('Cuiabá Cristo Rei DISPONÍVEL', neighborhoods, ['disponível']))?.toMatchObject({ neighborhood: 'Cristo Rei' }));
  it('recognizes a configured keyword without accents', () => expect(parseRoute('Jardim Vitória - 02', neighborhoods, ['disponivel', '- 02'])?.neighborhood).toBe('Jardim Vitória'));
  it('rejects unknown neighborhood', () => expect(parseRoute('Cuiabá Centro DISPONÍVEL', neighborhoods, ['disponível'])).toBeNull());
  it('rejects ordinary chat', () => expect(parseRoute('Bom dia, pessoal', neighborhoods, ['disponível'])).toBeNull());
});
