# AvaliaTech SaaS

Protótipo full stack de uma plataforma SaaS de recrutamento e avaliações técnicas para PMEs.

## Stack desta entrega

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express, TypeScript e Prisma.
- Banco: Prisma configurado com SQLite local por padrão, pronto para trocar para PostgreSQL.

## Como rodar

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3333
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
- `POST /submissions`
- `GET /ranking`

## Banco de dados

O schema inicial fica em `backend/prisma/schema.prisma`. Para ativar persistência real:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```
