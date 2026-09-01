# Parte 4 — Protótipo Funcional de Alta Fidelidade

## Objetivo

O AvaliaTech foi preparado como um protótipo funcional de alta fidelidade, com interface real em React, API em Node/Express, autenticação, banco persistente e suporte a banco em nuvem por PostgreSQL compatível com AWS RDS.

## Funcionalidades funcionais

- Login e cadastro de empresa/recrutador com senha hasheada.
- Dashboard alimentado por dados reais do banco.
- Criação de testes com dificuldade, duração e status.
- CRUD completo de questões objetivas e discursivas.
- Convite de candidatos com link único.
- Prova pública por token de convite.
- Submissão de respostas e correção automática das objetivas.
- Resultado individual por submissão.
- Ranking ordenado por pontuação e tempo.
- Relatórios de convites, submissões, média e taxa de conclusão.
- Aprovação ou recusa de candidatos em revisão.
- Interface responsiva com animações, microinterações e skeleton loading.

## Banco de dados local e cloud

O backend possui uma camada de persistência flexível:

- `DATABASE_PROVIDER=sqlite`: usa SQLite local para desenvolvimento e apresentação offline.
- `DATABASE_PROVIDER=postgres`: usa PostgreSQL em nuvem, indicado para AWS RDS.

O mesmo comando inicializa schema e dados de demonstração nos dois modos:

```bash
npm run db:setup
```

## Configuração AWS RDS PostgreSQL

1. Criar uma instância PostgreSQL no Amazon RDS.
2. Criar o banco `avaliatech`.
3. Liberar acesso ao Security Group apenas para o servidor da API.
4. Configurar variáveis no backend:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://avaliatech:SENHA@avaliatech.xxxxxx.sa-east-1.rds.amazonaws.com:5432/avaliatech
PGSSLMODE=require
JWT_SECRET=um-segredo-forte-de-producao
CORS_ORIGIN=https://dominio-do-front-end
```

5. Rodar:

```bash
npm install
npm run db:setup
npm run build
npm run start
```

## Deploy sugerido

- Frontend: AWS Amplify, S3 + CloudFront ou Vercel.
- Backend: AWS ECS/Fargate, Elastic Beanstalk ou Render apontando para AWS RDS.
- Banco: AWS RDS PostgreSQL.
- Arquivos futuros: Amazon S3.

## Evidências técnicas

- API REST real: `backend/src/server.ts`.
- Camada dual SQLite/PostgreSQL: `backend/src/database.ts`.
- Cliente HTTP com token: `frontend/src/services/api.ts`.
- Telas funcionais: `frontend/src/pages`.
- Documentação de uso: `README.md`.
