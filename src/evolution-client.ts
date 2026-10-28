export class EvolutionClient {
  constructor(private readonly baseUrl: string, private readonly apiKey: string, private readonly instance: string) {}
  private async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${endpoint}`, {
      method, headers: { apikey: this.apiKey, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let data: unknown = text;
    try { data = text ? JSON.parse(text) : {}; } catch { /* non-json response */ }
    if (!response.ok) throw new Error(`Evolution API ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    return data as T;
  }
  version(): Promise<unknown> { return this.request('GET', '/'); }
  connection(): Promise<unknown> { return this.request('GET', `/instance/connectionState/${encodeURIComponent(this.instance)}`); }
  connect(): Promise<unknown> { return this.request('GET', `/instance/connect/${encodeURIComponent(this.instance)}`); }
  groups(): Promise<unknown> { return this.request('GET', `/group/fetchAllGroups/${encodeURIComponent(this.instance)}`); }
  setWebhook(url: string): Promise<unknown> { return this.request('POST', `/webhook/set/${encodeURIComponent(this.instance)}`, { webhook: { enabled: true, url, byEvents: false, events: ['MESSAGES_UPSERT'] } }); }
  sendText(number: string, text: string, quoted?: unknown): Promise<unknown> {
    return this.request('POST', `/message/sendText/${encodeURIComponent(this.instance)}`, { number, text, ...(quoted ? { quoted } : {}) });
  }
}
