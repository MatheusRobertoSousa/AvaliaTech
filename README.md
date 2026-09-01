# AvaliaTech SaaS

SaaS de recrutamento e avaliações técnicas para PMEs. Esta versão atende ao protótipo funcional de alta fidelidade: interface real, backend real, banco persistente, autenticação, fluxo de candidatos e preparação para banco em nuvem com AWS RDS PostgreSQL.

Repositório: `https://github.com/MatheusRobertoSousa/AvaliaTech`

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express, TypeScript, Zod e driver `pg`.
- Banco local: SQLite via `node:sqlite`.
- Banco cloud: PostgreSQL compatível com AWS RDS via `DATABASE_PROVIDER=postgres`.
- Autenticação: senha hasheada com `scrypt` e token assinado.
- Deploy sugerido: AWS RDS PostgreSQL, ECS/Fargate ou Elastic Beanstalk, S3/CloudFront.

## Requisitos

- Node.js 24 ou superior.
- npm 11 ou superior.
- Docker opcional para testar PostgreSQL local.

## Como rodar localmente

Na raiz do projeto:

```bash
npm install
npm run db:setup
npm run db:check
npm run dev
```

Acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333`

Login demonstrativo:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`

## Banco em nuvem — AWS RDS PostgreSQL

O backend possui uma camada de persistência dual. Por padrão usa SQLite local; para cloud, usa PostgreSQL com a mesma API e os mesmos fluxos.

Exemplo de variáveis para produção:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://avaliatech:SENHA@avaliatech.xxxxxx.sa-east-1.rds.amazonaws.com:5432/avaliatech
PGSSLMODE=require
JWT_SECRET=um-segredo-forte-de-producao
CORS_ORIGIN=https://dominio-do-front-end
VITE_API_URL=https://dominio-da-api
```

Depois de configurar a conexão do RDS:

```bash
npm install
npm run db:setup
npm run db:check
npm run build
npm run start
```

O comando `npm run db:setup` cria as tabelas e popula dados fictícios realistas também no PostgreSQL.
Use `npm run db:check` para confirmar se o backend está conectado ao provider esperado (`sqlite` ou `postgres`).

## PostgreSQL local opcional

Se tiver Docker instalado:

```bash
docker compose up -d postgres
```

Configure:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://avaliatech:avaliatech@localhost:5432/avaliatech
```

Então rode:

```bash
npm run db:setup
npm run dev
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

## Endpoints principais

- `GET /health`
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
- `backend/src/database.ts`: camada dual SQLite/PostgreSQL, schema e seed.
- `backend/prisma/schema.prisma`: schema de referência para PostgreSQL.
- `docs/parte-4-prototipo-alta-fidelidade.md`: documentação da entrega de alta fidelidade e cloud.

## Problemas comuns

- `'tsx' não é reconhecido`: rode `npm install` na raiz antes de executar scripts.
- Tela padrão “Vite + React”: entre na raiz correta do AvaliaTech e rode `npm run dev`.
- Banco vazio ou antigo: rode `npm run db:setup`.
- Erro de `node:sqlite`: atualize para Node.js 24+.
- Porta ocupada: encerre processos antigos de Node ou ajuste `PORT` e `VITE_API_URL`.
