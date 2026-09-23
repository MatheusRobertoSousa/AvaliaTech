# AvaliaTech SaaS

SaaS acadêmico de recrutamento com React/TypeScript, API Node.js 24/Express e PostgreSQL no Microsoft Azure for Students.

**Aplicação publicada:** https://avaliatech-156973.azurewebsites.net

Validação concluída: 17 requests HTTP, login e navegação no navegador, leitura do mesmo registro após reiniciar a API. Evidências em `docs/evidencias/`.

## Entrega técnica (15 pontos)

[Arquiteturas, tecnologias, requests, configuração e roteiro final de apresentação](docs/implementacao-tecnica-azure.md).

A simulação fica em `scripts/demo-api.mjs`; os resultados reais ficam em `docs/evidencias/demo-api.json`.

## Execução local

```sh
npm install
npm run dev
```

Frontend: http://localhost:5173. API: http://localhost:3333/api. Requer Node.js 24+. SQLite e seed local são criados automaticamente. Login local: `recrutador@techsolutions.com` / `123456`.

```sh
npm run build
npm run demo:api
```

**`npm run db:setup` apaga e recria o banco selecionado. Não execute no Azure com dados que deseja preservar.** Em produção a inicialização cria tabelas sem reset e sem conta com senha pública.

## Azure

Frontend e API são servidos no mesmo App Service Linux. API em `/api`; banco PostgreSQL com TLS validado. Configurações sensíveis ficam no App Service e nos arquivos locais ignorados em `.azure/`.

```powershell
powershell -NoProfile -File scripts/package-azure.ps1
$env:DEMO_API_URL = 'https://SEU-APP.azurewebsites.net/api'
$env:DEMO_EXPECT_POSTGRES = 'true'
npm run demo:api
```

Cada simulação cria novos dados fictícios. As credenciais da conta gerada ficam em `.azure/demo-login.json`, para abrir os mesmos registros na interface. Não compartilhe esse arquivo.

## Estrutura

- `frontend/src/pages`: telas de recrutador/candidato.
- `frontend/src/services/api.ts`: Axios, token e contratos.
- `backend/src/server.ts`: API, validação e regras.
- `backend/src/database.ts`: SQL parametrizado, schema e SQLite/PostgreSQL.
- `backend/src/auth.ts`: scrypt e tokens HMAC.
- `backend/prisma/schema.prisma`: referência; Prisma não é usado em execução.
- `scripts/package-azure.ps1`: ZIP para Linux sem credenciais.
- `scripts/demo-api.mjs`: demonstração HTTP com verificações.

Protótipo acadêmico: use dados fictícios. A nota objetiva total é real; indicadores por categoria são ilustrativos. Não há envio de e-mail, armazenamento de anexos ou execução isolada de código.
