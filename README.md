# AvaliaTech SaaS

Protótipo funcional de um SaaS de recrutamento e avaliações técnicas para pequenas e médias empresas.

## Visão Geral

O AvaliaTech permite que uma empresa crie avaliações, cadastre questões, convide candidatos, aplique provas online, corrija respostas objetivas e acompanhe ranking e relatórios operacionais.

Esta versão foi preparada para apresentação em nível de produto: dados fictícios realistas, banco local persistente, fluxo ponta a ponta e interface responsiva.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express e TypeScript.
- Banco local: SQLite via `node:sqlite`.
- Planejamento cloud: AWS com Amazon RDS PostgreSQL, S3 e ECS/Fargate.

## Requisitos

- Node.js 24 ou superior.
- npm 11 ou superior.

O backend usa `node:sqlite`, disponível em versões recentes do Node. Em Node 20 ou inferior, atualize o Node antes de executar.

## Instalação

Na raiz do projeto:

```bash
npm install
npm run db:setup
npm run dev
```

Depois acesse:

- Frontend: http://localhost:5173
- Backend: http://localhost:3333

Login demonstrativo:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`

## Rodar em modo de apresentação

```bash
npm run db:setup
npm run build
npm run start
```

O comando `start` executa a API compilada e o preview do frontend.

## Banco de Dados

O banco SQLite é criado em `backend/data/avaliatech.sqlite`. Ele não é versionado.

Para restaurar os dados fictícios de demonstração:

```bash
npm run db:setup
```

## Dados Fictícios

A base inclui:

- Empresa fictícia: Nexa People Consultoria.
- Vagas/testes para Frontend React, Backend Node.js, Dados, Customer Success e UX/UI.
- Questões objetivas e discursivas por trilha.
- Candidatos fictícios com status aprovado, em revisão e pendente.
- Submissões com notas e tempos realistas.

Todos os nomes e e-mails são fictícios.

## Endpoints Principais

- `POST /auth/login`
- `POST /auth/register`
- `GET /dashboard`
- `GET /tests`
- `POST /tests`
- `DELETE /tests/:id`
- `GET /questions`
- `POST /questions`
- `DELETE /questions/:id`
- `GET /candidates`
- `POST /candidates`
- `POST /submissions`
- `GET /submissions/latest`
- `GET /ranking`
- `GET /reports`

## Estrutura

- `frontend/src/pages`: telas do sistema.
- `frontend/src/components`: componentes reutilizáveis.
- `frontend/src/services/api.ts`: cliente HTTP e tipos compartilhados.
- `backend/src/server.ts`: API REST.
- `backend/src/database.ts`: schema SQLite e seed de dados.
- `docs`: documentos da entrega e roteiro de teste de usabilidade.

## Solução de Problemas

### `'tsx' não é reconhecido`

Rode `npm install` na raiz do projeto. Não rode os comandos dentro de `backend` ou `frontend` antes de instalar as dependências da raiz.

### Aparece a tela padrão "Vite + React"

O servidor foi iniciado na pasta errada ou há outro Vite rodando. Feche os terminais, entre na raiz do AvaliaTech e rode:

```bash
npm run dev
```

### Porta ocupada

Pare processos antigos de Node ou altere as portas em `.env` e `frontend/vite.config.ts`.
