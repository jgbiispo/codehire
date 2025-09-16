# CodeHire – Job board remoto-first

Portal de vagas estilo RemoteOK, com backend em **Node.js/Express**, **PostgreSQL** e **Sequelize**.  
Inclui autenticação (cookies HttpOnly), CRUD de empresas e vagas, candidaturas, tags, bookmarks, migrations e validações com **Zod**.

> Status: MVP em desenvolvimento. Tokens de acesso/refresh ainda em **modo stub** (trocar por JWT em produção).

---

## Sumário

- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Scripts](#scripts)
- [Banco de dados](#banco-de-dados)
- [Executando](#executando)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Rotas principais](./backend/DOCS.MD/#rotas-principais)
- [Exemplos de requisição](./backend/DOCS.MD/#exemplos-de-requisição)
- [Licença](#licença)

---

## Stack

- **Node.js** (ESM) + **Express**
- **PostgreSQL** + **Sequelize** (+ **sequelize-cli** para migrations/seeders)
- **Zod** (validação)
- **bcrypt** (hash de senha)
- **cookie-parser** (cookies HttpOnly)
- Extensões Postgres: `pgcrypto`, `pg_trgm`

---

## Pré-requisitos

- Node 18+ (recomendado 20+)
- PostgreSQL 13+
- `psql` (opcional, para testar DB via terminal)

---

## Configuração

Crie um arquivo `.env` na raiz:

```json
DATABASE_URL=postgres://usuario:senha@localhost:5432/portal_empregos
PGSSL=false
NODE_ENV=development
PORT=3000
COOKIE_DOMAIN=localhost
```

```bash
# Instale as dependências:
pnpm install
```

Configure o sequelize-cli com o arquivo .sequelizerc (já incluso no projeto) apontando para db/config.cjs.

## Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:create": "sequelize-cli db:create",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all"
  }
}
```

> Dica: se precisar, rode pnpm db:create para criar o banco definido em DATABASE_URL.

## Banco de dados

As migrations criam:

- users, refresh_tokens
- companies
- jobs
- tags, job_tags (pivot)
- applications
- bookmarks
- Enums: role, employment_type, experience_level, job_status, application_status, tag_type.

Rode as migrations:

```bash
pnpm db:migrate
```

> Se algo falhar, use pnpm db:migrate:undo e tente novamente.

## Executando

```bash
pnpm run dev

# Você deve ver algo como:
Server is running on http://localhost:3000
Database connected successfully.
```

## Estrutura de pastas (BACKEND)

```chsarp
├─ backend
│ ├─ db/
│ │  ├─ config.cjs            # config do sequelize-cli (envs)
│ │  ├─ migrations/          # migrations (0001...0007)
│ │  └─ seeders/             # (opcional)
│ ├─ src/
│ │  ├─ db/
│ │  │  └─ sequelize.js      # instancia do Sequelize + models + associações
│ │  ├─ controllers/
│ │  │  └─ auth_controller/
│ │  │     └─ register.controller.js  # exemplo (login/refresh/logout em controllers irmãos)
│ │  ├─ routes/
│ │  │  └─ auth.routes.js    # rotas de auth (e demais: companies, jobs, tags, admin...)
│ │  ├─ middlewares/         # (auth, rbac, rate-limit, error handler)
│ │  ├─ index.js             # bootstrap do servidor
│ │  └─ app.js               # configuração do Express
│ ├─ .sequelizerc
│ ├─ package.json
└─ README.md
```

## Licença

MIT © 2025 Nidus Soluções Digitais LTDA
