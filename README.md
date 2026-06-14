# AvaliaTech SaaS

Protótipo full stack de uma plataforma SaaS de recrutamento e avaliações técnicas para PMEs.

## Stack desta entrega

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express e TypeScript.
- Banco: SQLite local com seed automático ao iniciar a API.
- Futuro: `backend/prisma/schema.prisma` documenta a modelagem para migração para PostgreSQL/ORM.

## Como rodar

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3333

Login demo:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`
Login demo: recrutador@techsolutions.com / 123456

## Endpoints iniciais

- `POST /auth/login`
- `POST /auth/register`
- `GET /dashboard`
- `GET /tests`
- `POST /tests`
- `GET /questions`
- `POST /questions`
- `GET /candidates`
- `POST /candidates`
- `POST /submissions`
- `GET /ranking`
- `GET /reports`

## Banco de dados

O backend cria e alimenta automaticamente o arquivo SQLite em `backend/data/avaliatech.sqlite`.

Para resetar a base com os dados de demonstração:

```bash
npm run db:setup --workspace backend
```

O arquivo `.sqlite` não é versionado.

## Documentos da entrega

- `docs/parte-2-implementacao-geral.md`: stack, justificativa, fluxos implementados e plano de cloud.
- `docs/parte-3-teste-usabilidade.md`: roteiro para teste com 3 usuários, tarefas e planilha de avaliação.
