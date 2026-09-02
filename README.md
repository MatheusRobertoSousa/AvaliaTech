# AvaliaTech SaaS

Protótipo funcional de alta fidelidade desenvolvido para a Sprint da FIAP. O AvaliaTech é um SaaS de recrutamento e avaliações técnicas para PMEs, com interface front-end real, API back-end real, banco de dados persistente e arquitetura preparada para uso em nuvem AWS.

Repositório: `https://github.com/MatheusRobertoSousa/AvaliaTech`

## Status da Entrega FIAP

Esta versão atende aos requisitos da etapa de protótipo funcional de alta fidelidade:

- Interface web funcional com React e TypeScript.
- Back-end funcional com Node.js, Express e TypeScript.
- Banco de dados persistente com SQLite para demonstração local.
- Camada de persistência preparada para PostgreSQL em nuvem.
- Configuração compatível com AWS RDS PostgreSQL.
- Fluxos reais de recrutador, candidato, prova, resultado, ranking e relatórios.

## Observação Sobre AWS

O projeto está tecnicamente adequado para uso em ambiente AWS, principalmente com:

- AWS RDS PostgreSQL para banco de dados em nuvem.
- AWS ECS/Fargate ou Elastic Beanstalk para hospedar a API.
- AWS S3 + CloudFront ou AWS Amplify para publicar o front-end.
- Variáveis de ambiente para alternar entre SQLite local e PostgreSQL em nuvem.

No entanto, nesta entrega não foi realizado login, provisionamento ou deploy em uma conta AWS real, pois a equipe não possui uma conta AWS disponível/ativa para autenticação e criação dos recursos. Por isso, o projeto foi entregue com preparação cloud-ready, documentação de configuração e suporte técnico para conexão futura a um RDS PostgreSQL assim que uma conta AWS estiver disponível.

## Funcionalidades Implementadas

- Login e cadastro real de empresa/recrutador.
- Autenticação com senha hasheada usando `scrypt` e token assinado.
- Dashboard com métricas calculadas pelo banco.
- Criação de testes com status, dificuldade e duração.
- Banco de questões com criar, editar, duplicar e excluir.
- Convite de candidatos com link individual para prova.
- Tela pública de prova por token de convite.
- Submissão de respostas com correção automática de questões objetivas.
- Resultado individual por submissão.
- Ranking ordenado por pontuação e tempo.
- Relatórios com convites, submissões, taxa de conclusão e média.
- Pipeline de candidatos em cards responsivos.
- Aprovação ou recusa de candidatos em revisão.
- Skeleton loading, animações de entrada e microinterações.

## Stack Técnica

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express, TypeScript, Zod e driver `pg`.
- Banco local: SQLite via `node:sqlite`.
- Banco cloud planejado: PostgreSQL compatível com AWS RDS.
- Deploy sugerido: AWS RDS, ECS/Fargate ou Elastic Beanstalk, S3/CloudFront.

## Requisitos

- Node.js 24 ou superior.
- npm 11 ou superior.
- Docker opcional para testar PostgreSQL local.

## Como Rodar Localmente

Na raiz do projeto:

```bash
npm install
npm run db:setup
npm run db:check
npm run dev
```

Acesse:

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:3333`

Login demonstrativo:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`

## Modo de Apresentação

```bash
npm run db:setup
npm run build
npm run start
```

## Banco de Dados

O banco local SQLite é criado em `backend/data/avaliatech.sqlite` e não é versionado.

Para recriar a base com dados fictícios realistas:

```bash
npm run db:setup
```

Para verificar a conexão atual:

```bash
npm run db:check
```

O retorno indica se o backend está usando `sqlite` ou `postgres`.

## Configuração Para AWS RDS PostgreSQL

Quando houver uma conta AWS disponível, crie uma instância PostgreSQL no Amazon RDS e configure as variáveis abaixo:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://avaliatech:SENHA@avaliatech.xxxxxx.sa-east-1.rds.amazonaws.com:5432/avaliatech
PGSSLMODE=require
JWT_SECRET=um-segredo-forte-de-producao
CORS_ORIGIN=https://dominio-do-front-end
VITE_API_URL=https://dominio-da-api
```

Depois, execute:

```bash
npm install
npm run db:setup
npm run db:check
npm run build
npm run start
```

O comando `npm run db:setup` cria as tabelas e popula dados fictícios realistas também no PostgreSQL.

## PostgreSQL Local Opcional

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

## Endpoints Principais

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

## Estrutura do Projeto

- `frontend/src/pages`: telas do SaaS.
- `frontend/src/components`: componentes reutilizáveis, incluindo skeleton loading.
- `frontend/src/services/api.ts`: cliente HTTP, token e tipos compartilhados.
- `backend/src/server.ts`: API REST.
- `backend/src/auth.ts`: hash de senha, geração de IDs e tokens.
- `backend/src/database.ts`: camada dual SQLite/PostgreSQL, schema e seed.
- `backend/prisma/schema.prisma`: schema de referência para PostgreSQL.
- `docs/parte-4-prototipo-alta-fidelidade.md`: documentação da entrega de alta fidelidade e cloud.

## Problemas Comuns

- `'tsx' não é reconhecido`: rode `npm install` na raiz antes de executar scripts.
- Tela padrão “Vite + React”: entre na raiz correta do AvaliaTech e rode `npm run dev`.
- Banco vazio ou antigo: rode `npm run db:setup`.
- Erro de `node:sqlite`: atualize para Node.js 24+.
- Porta ocupada: encerre processos antigos de Node ou ajuste `PORT` e `VITE_API_URL`.
