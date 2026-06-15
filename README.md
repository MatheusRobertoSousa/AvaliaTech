# AvaliaTech SaaS

Protótipo full stack de uma plataforma SaaS de recrutamento e avaliações técnicas para PMEs.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express e TypeScript.
- Banco local: SQLite com seed automático.
- Planejamento cloud: AWS com PostgreSQL em Amazon RDS.

## Requisitos

- Node.js 24 ou superior.
- npm 11 ou superior.

O backend usa `node:sqlite`, recurso disponível nas versões recentes do Node. Se estiver usando Node 20 ou inferior, atualize o Node antes de rodar.

## Como rodar em outro PC

Abra o terminal na pasta raiz do projeto, não dentro de `backend` ou `frontend`.

Exemplo no Windows:

```bash
cd "C:\Users\Pichau\Downloads\AvaliaTech-main\AvaliaTech-main"
npm install
npm run db:setup --workspace backend
npm run dev
```

Se o arquivo estiver em uma pasta com `(2)` no nome, use aspas:

```bash
cd "C:\Users\Pichau\Downloads\AvaliaTech-main (2)\AvaliaTech-main"
```

Depois acesse:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3333

Login demo:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`

## Erros comuns

### `'tsx' não é reconhecido`

Esse erro significa que as dependências não foram instaladas. Rode na raiz do projeto:

```bash
npm install
```

Depois rode:

```bash
npm run db:setup --workspace backend
npm run dev
```

### Aparece a tela padrão "Vite + React"

Isso indica que o servidor aberto no navegador não é o AvaliaTech, ou que foi iniciada a pasta errada.

Feche os terminais, pare processos antigos de Node se necessário, entre na pasta raiz do AvaliaTech e rode:

```bash
npm run dev
```

No AvaliaTech, a primeira tela deve ser o login da plataforma, não a tela padrão do Vite.

### `localhost` não abre nada

Confira se os dois servidores estão rodando no terminal:

- Vite em `http://localhost:5173`
- API em `http://localhost:3333`

Teste a API:

```bash
curl http://localhost:3333/health
```

## Endpoints principais

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
