# AvaliaTech SaaS

SaaS de recrutamento e avaliações técnicas para PMEs, com fluxo real de recrutador e candidato: login, banco de dados, criação de testes, CRUD de questões, convites por link, prova pública, correção automática, ranking, relatórios e decisão de candidatos.

Repositório: `https://github.com/MatheusRobertoSousa/AvaliaTech`

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express, TypeScript e Zod.
- Banco local: SQLite via `node:sqlite`.
- Autenticação: senha hasheada com `scrypt` e token assinado.
- Planejamento cloud: AWS com RDS PostgreSQL, S3 e ECS/Fargate.

## Requisitos

- Node.js 24 ou superior.
- npm 11 ou superior.

O backend usa `node:sqlite`; se aparecer erro relacionado ao SQLite nativo, atualize o Node.

## Como rodar

Na raiz do projeto:

```bash
npm install
npm run db:setup
npm run dev
```

Acesse:

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

## Funcionalidades implementadas

- Login e cadastro real de empresa/recrutador.
- Dashboard com métricas calculadas pelo banco.
- Criação de testes com status, dificuldade e duração.
- Banco de questões com criar, editar, duplicar e excluir.
- Convite de candidatos com link individual para prova.
- Tela pública de prova por token de convite.
- Submissão com correção automática de questões objetivas.
- Resultado individual por submissão.
- Ranking ordenado por pontuação e tempo.
- Relatórios com convites, submissões, conclusão e média.
- Pipeline de candidatos em cards responsivos.
- Aprovação ou recusa de candidatos em revisão.
- Skeleton loading, animações de entrada e microinterações.

## Banco de dados

O SQLite é criado em `backend/data/avaliatech.sqlite` e não é versionado.

Para recriar a base com dados fictícios realistas:

```bash
npm run db:setup
```

A base demonstrativa inclui empresa, usuário recrutador, testes, questões, convites, candidatos e submissões fictícias.

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
- `PATCH /candidates/:id/status`
- `GET /invitations/:token`
- `POST /submissions`
- `GET /submissions/:id`
- `GET /ranking`
- `GET /reports`

## Estrutura

- `frontend/src/pages`: telas do SaaS.
- `frontend/src/components`: componentes reutilizáveis, incluindo skeleton loading.
- `frontend/src/services/api.ts`: cliente HTTP, token e tipos compartilhados.
- `backend/src/server.ts`: API REST.
- `backend/src/auth.ts`: hash de senha, geração de IDs e tokens.
- `backend/src/database.ts`: schema SQLite e seed.
- `docs`: documentos da entrega e roteiro de teste de usabilidade.

## Problemas comuns

- `'tsx' não é reconhecido`: rode `npm install` na raiz antes de executar scripts.
- Tela padrão “Vite + React”: entre na raiz correta do AvaliaTech e rode `npm run dev`.
- Banco vazio ou antigo: rode `npm run db:setup`.
- Porta ocupada: encerre processos antigos de Node ou ajuste `PORT` e `VITE_API_URL`.
