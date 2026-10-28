# Shopee Route Bot — MVP

Robô simples em Node.js/TypeScript para monitorar grupos do WhatsApp pela Evolution API existente e solicitar rotas Shopee no privado do responsável.

## Como funciona

1. Configure a URL e a chave da Evolution API no `.env` (a chave nunca fica no `config.json`).
2. Edite `config.json` com o ID Shopee, instância, grupos, responsáveis e bairros.
3. Suba o bot e confirme a versão da Evolution em `GET /admin/evolution-version` ou diretamente no endpoint `/` da Evolution.
4. Conecte a instância pelo Evolution Manager ou abra `GET /admin/connect` para obter o QR Code.
5. Use `GET /admin/groups` para obter os IDs dos grupos e configure os grupos monitorados.
6. Registre o webhook chamando `POST /admin/webhook`. O endereço deve ser público e estar em `WEBHOOK_PUBLIC_URL`.

O webhook aceita `MESSAGES_UPSERT`, ignora mensagens próprias, grupos não configurados, texto sem bairro/palavra-chave e eventos duplicados. O histórico fica em SQLite.

## Configuração

`config.json` é intencionalmente sem segredos:

- `shopeeId`: ID do motorista.
- `evolution.instance`: nome da instância já existente.
- `groups`: `id` do grupo (`@g.us`) e telefone do responsável.
- `acceptedNeighborhoods` e `keywords`: regras de reconhecimento.
- `enabled`: habilita o envio real.
- `simulation`: registra reconhecimento sem enviar mensagens.

Comece com `enabled: false` e `simulation: true`. Para produção, use `enabled: true` e `simulation: false` após validar o histórico.

## Citação e fallback

Na Evolution API v2 Node.js, `sendText` aceita `quoted` com a `key` e a mensagem original. O bot tenta enviar a solicitação citando a mensagem do grupo. Se a instância rejeitar o formato, ele envia a mensagem original e a solicitação em mensagens separadas. O status registrado é de envio (`sent`/`failed`), nunca de confirmação da rota.

## Execução local

```bash
cp .env.example .env
npm install
npm test
npm run build
npm start
```

## Docker

```bash
cp .env.example .env
docker compose up -d --build
```

O SQLite é persistido em `./data`. O compose não sobe nem altera a Evolution API; `EVOLUTION_API_URL` deve apontar para a instalação que já existe na VPS. Se estiver em outro container, use o nome da rede/serviço existente ou o endereço publicado.

## Teste manual de simulação

```bash
curl -X POST http://localhost:3000/webhooks/evolution \
  -H 'content-type: application/json' \
  -d '{"event":"MESSAGES_UPSERT","data":{"key":{"id":"teste-1","remoteJid":"120363000000000000@g.us","fromMe":false},"message":{"conversation":"Cuiabá Cristo Rei DISPONÍVEL"}}}'
```

Consulte `GET /admin/history` para verificar o resultado. Em produção, proteja as rotas `/admin/*` com firewall/reverse proxy e um token antes de expor a internet; o webhook é a única rota pública necessária para a operação.
