# AvaliaTech SaaS

SaaS de recrutamento e avaliações técnicas para PMEs, com login real, banco SQLite, criação de testes, CRUD de questões, convites por link, prova pública para candidatos, correção objetiva automática, ranking e relatórios.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express, TypeScript e Zod.
- Banco local: SQLite via `node:sqlite`.
- Pronto para cloud: migração planejada para AWS com RDS PostgreSQL, S3 e ECS/Fargate.

## Requisitos

- Node.js 24 ou superior.
- npm 11 ou superior.

O backend usa `node:sqlite`; se aparecer erro relacionado ao SQLite nativo, atualize o Node.

## Como rodar

```bash
npm install
npm run db:setup
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333`

Login demonstrativo:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`

## Modo apresentação

```bash
npm run db:setup
npm run build
npm run start
```

## Funcionalidades reais

- Autenticação com senha hasheada e token assinado.
- Cadastro de empresa e recrutador.
- Dashboard alimentado por testes, convites e submissões reais.
- Criação, edição, duplicação e exclusão de questões.
- Criação de candidatos com link de convite único.
- Tela pública de prova por token de convite.
- Submissão com cálculo automático de nota objetiva.
- Ranking ordenado por pontuação e tempo.
- Relatórios com convites, submissões, taxa de conclusão e média.

## Banco de dados

O SQLite é criado em `backend/data/avaliatech.sqlite` e não é versionado.

Para recriar a base com dados fictícios realistas:

```bash
npm run db:setup
```

## Endpoints principais

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `GET /dashboard`
- `GET /tests`
- `POST /tests`
- `PUT /tests/:id`
- `DELETE /tests/:id`
- `GET /questions?testId=...`
- `POST /questions`
- `PUT /questions/:id`
- `DELETE /questions/:id`
- `GET /candidates`
- `POST /candidates`
- `GET /invitations/:token`
- `POST /submissions`
- `GET /submissions/:id`
- `GET /ranking`
- `GET /reports`

## Estrutura

- `frontend/src/pages`: telas do SaaS.
- `frontend/src/components`: componentes reutilizáveis.
- `frontend/src/services/api.ts`: cliente HTTP, token e tipos compartilhados.
- `backend/src/server.ts`: API REST.
- `backend/src/auth.ts`: hash de senha, geração de IDs e tokens.
- `backend/src/database.ts`: schema SQLite e seed.
- `docs`: documentos da entrega e roteiro de teste de usabilidade.

## Problemas comuns

- `'tsx' não é reconhecido`: rode `npm install` na raiz do projeto antes de executar scripts.
- Tela padrão “Vite + React”: entre na raiz correta do AvaliaTech e rode `npm run dev`.
- Banco vazio ou antigo: rode `npm run db:setup`.
- Porta ocupada: encerre processos antigos de Node ou ajuste `PORT` e `VITE_API_URL`.
