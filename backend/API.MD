# CodeHire – API Docs

API REST do CodeHire. Baseada em JSON, com autenticação via **JWT** (cookies httpOnly e/ou `Authorization: Bearer`).

- **Base URL (dev):** `http://localhost:3000/api/v1`
- **Formato:** `application/json`
- **Versionamento:** prefixo `/api/v1`
- **Paginação padrão:** `limit` (1–100, default 20), `offset` (default 0)

---

## Sumário

- [Autenticação](#autenticação)
- [Erros](#erros)
- [Entidades (resumo)](#entidades-resumo)
- [Rotas](#rotas)
  - [Auth](#auth)
  - [User](#user)
  - [Companies](#companies)
  - [Jobs](#jobs)
  - [Applications](#applications)
  - [Health](#health)
- [Códigos de erro comuns](#códigos-de-erro-comuns)
- [Roadmap / WIP](#roadmap--wip)

---

## Autenticação

- Login retorna JWT e semeia **cookies httpOnly** (`access`, `refresh`).
- Alternativamente, envie `Authorization: Bearer <access_token>`.
- **Roles:** `candidate`, `employer`, `admin`.
- Rotas marcadas como **(auth)** exigem usuário autenticado; onde indicado, há também checagem de **role/ownership**.

---

## Erros

Formato padrão:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "details": [] // opcional (ex.: validação do Zod)
  }
}
```

---

## Entidades (resumo)

### User (público)

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "candidate|employer|admin",
  "headline": "string|null",
  "location": "string|null",
  "avatarUrl": "string|null"
}
```

### Company

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "logoUrl": "string|null",
  "website": "string|null",
  "description": "string|null",
  "location": "string|null",
  "verified": true,
  "socials": { "linkedin": "https://...", "...": "..." },
  "jobCount": 5 // quando listado
}
```

### Job

```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "description": "string",
  "employmentType": "full_time|part_time|contract|internship|temporary",
  "experienceLevel": "junior|mid|senior|lead",
  "salary": { "min": 0, "max": 0, "currency": "BRL" },
  "remote": true,
  "timezone": "string|null",
  "visaSponsorship": false,
  "location": "string|null",
  "status": "draft|pending|approved|rejected|expired",
  "featuredUntil": "2025-12-31T23:59:59.000Z|null",
  "postedAt": "2025-09-01T10:00:00.000Z|null",
  "expiresAt": "2025-10-01T23:59:59.000Z|null",
  "company": { "...": "..." },
  "tags": [{ "id": "uuid", "name": "React", "slug": "react", "type": "tech" }]
}
```

### Application

```json
{
  "id": "uuid",
  "status": "submitted|in_review|shortlisted|rejected|hired",
  "resumeUrl": "string",
  "coverLetterMd": "string|null",
  "answers": { "q1": "..." },
  "candidate": { "...": "User" },
  "job": { "...": "Job" }
}
```

---

## Rotas

### Auth

#### POST `/register`

Cria usuário.

**Body**

```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "Admin#123",
  "role": "candidate|employer|admin" // opcional; default: candidate
}
```

**201**

```json
{ "user": { "id","name","role","avatarUrl" } }
```

---

#### POST `/login`

Autentica e define cookies JWT.

**Body**

```json
{ "email": "admin@example.com", "password": "Admin#123" }
```

**200**

```json
{ "user": { "id","name","email","role" } }
```

> Em dev, a API pode também retornar tokens no body.

---

#### POST `/refresh`

Renova o access token usando o refresh (cookie).

**200**

```json
{ "ok": true }
```

---

#### POST `/logout`

Limpa cookies de autenticação.

**200**

```json
{ "ok": true }
```

---

### User

#### GET `/me` _(auth)_

Retorna o usuário autenticado.

**200**

```json
{ "id","name","email","role","headline","location","avatarUrl" }
```

---

#### PATCH `/me` _(auth)_

Atualiza perfil **ou** troca de senha.

**Body (exemplos)**

```json
{
  "headline": "Full-Stack JS",
  "location": "São Paulo, SP",
  "avatarUrl": "https://..."
}
```

```json
{ "currentPassword": "StrongPass#123", "newPassword": "NewStrong#456" }
```

**200**

```json
{ "id","name","role","headline","location","avatarUrl" }
```

---

#### GET `/me/bookmarks` _(auth)_

Vagas salvas (paginado).

**Query**

```
?limit=20&offset=0&status=approved|pending|draft|rejected|expired
```

**200**

```json
{
  "total": 1,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id": "job-uuid",
      "title": "Senior Full-Stack Engineer",
      "...": "...",
      "bookmarkedAt": "2025-09-12T14:30:00.000Z",
      "company": { "...": "..." },
      "tags": [{ "...": "..." }]
    }
  ]
}
```

---

#### GET `/me/applications` _(auth)_

Minhas candidaturas (paginado).

**Query**

```
?limit=20&offset=0&status=submitted|in_review|shortlisted|rejected|hired
```

**200**

```json
{
  "total": 1,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id": "uuid",
      "status": "submitted",
      "job": { "...": "..." },
      "company": { "...": "..." }
    }
  ]
}
```

---

### Companies

#### GET `/companies`

Lista empresas com filtros.

**Query**

```
q=texto
verified=true|false
ownerId=<uuid>
sort=recent|jobs
order=asc|desc
limit, offset
```

**200**

```json
{
  "total": 2,
  "limit": 10,
  "offset": 0,
  "items": [
    {
      "id": "...",
      "name": "Nidus Solutions",
      "slug": "nidus-solutions",
      "jobCount": 5,
      "verified": true,
      "...": "..."
    }
  ]
}
```

---

#### GET `/companies/:slug`

Detalhes + vagas **approved** da empresa.

**200**

```json
{
  "id":"uuid",
  "name":"Nidus Solutions",
  "slug":"nidus-solutions",
  "verified":true,
  "socials": { "linkedin":"..." },
  "jobs":[
    { "id":"...","title":"...","status":"approved","tags":[...] }
  ]
}
```

---

#### POST `/companies` _(auth)_

Cria empresa (owner = usuário logado).

**Body**

```json
{
  "name": "Nidus Solutions",
  "website": "https://nidus.com",
  "description": "Somos uma empresa...",
  "location": "Global",
  "logoUrl": "https://...",
  "socials": { "linkedin": "https://..." }
}
```

**201**

```json
{ "company": { "id","name","slug","logoUrl","website","description","location","verified","socials" } }
```

---

#### PATCH `/companies/:id` _(auth: owner|admin)_

Atualiza dados da empresa.

**Body**

```json
{
  "name": "Minha Empresa Ltda",
  "website": "https://minha-empresa.com",
  "description": "Atualizando descrição",
  "location": "Global",
  "logoUrl": "https://logo.example.com/logo.png",
  "socials": { "linkedin": "https://linkedin.com/company/minha-empresa" }
}
```

**200**

```json
{ "id","name","slug","logoUrl","website","description","location","verified","socials" }
```

---

#### POST `/companies/:id/verify` _(auth: admin)_

Marca a empresa como verificada.

**200**

```json
{ "company": { "id","name","verified":true,"verifiedAt":"...","verifiedBy":"user-uuid" } }
```

---

### Jobs

#### POST `/jobs` _(auth: admin | employer owner da company)_

Cria vaga. **Employer** cria como `pending` (sem `postedAt`); **admin** pode criar `approved`/`featured`.

**Body**

```json
{
  "companyId": "uuid",
  "title": "Senior Full-Stack Engineer",
  "descriptionMd": "Stack: Next.js, Node, AWS...",
  "employmentType": "full_time",
  "experienceLevel": "senior",
  "salaryMin": 18000,
  "salaryMax": 28000,
  "currency": "BRL",
  "remote": true,
  "timezone": "UTC-3 ±3",
  "visaSponsorship": false,
  "location": "Remote",
  "requirements": ["..."],
  "benefits": ["..."],
  "expiresAt": "2030-12-31T23:59:59.000Z",
  "tags": ["Next.js", "Node.js", "TypeScript", "AWS", "PostgreSQL"],

  // apenas admin:
  "status": "approved",
  "featuredUntil": "2030-01-10T23:59:59.000Z",
  "postedAt": "2030-01-01T12:00:00.000Z"
}
```

**201**

```json
{ "job": { "id","title","slug","status","postedAt","company":{...},"tags":[...] } }
```

---

#### GET `/jobs`

Listagem com filtros (paginado).

**Query (suportados)**

```
q=texto
tags=react,next-js,aws             # slugs (ou nomes normalizados)
experienceLevel=junior|mid|senior|lead
employmentType=full_time|part_time|contract|internship|temporary
remote=true|false
salaryMin=10000
salaryMax=30000
company=<companySlug>              # filtra por empresa
sort=recent|salary|featured
order=asc|desc
limit=20
offset=0
```

**200**

```json
{
  "total": 2,
  "limit": 20,
  "offset": 0,
  "items": [
    { "id":"...","title":"...","slug":"...","status":"approved","company":{...},"tags":[...] }
  ]
}
```

> **WIP (planejado):** > `GET /jobs/:slug`, `PATCH /jobs/:id`, `DELETE /jobs/:id`,
> `POST /jobs/:id/bookmark`, `DELETE /jobs/:id/bookmark`,
> `POST /jobs/:id/duplicate`.

---

### Applications

#### POST `/jobs/:id/apply` _(auth: candidate)_

Cria candidatura.

**Body**

```json
{
  "resumeUrl": "https://cdn.example.com/resume.pdf",
  "coverLetterMd": "Olá...",
  "answers": { "q1": "resp", "q2": 42 }
}
```

**201**

```json
{ "application": { "id","jobId","userId","status" } }
```

Erros comuns: `JOB_NOT_OPEN`, `JOB_EXPIRED`, `ALREADY_APPLIED`.

---

#### GET `/employer/applications` _(auth: employer owner | admin)_

Lista candidaturas do empregador.

**Query**

```
jobId=<uuid>
status=submitted|in_review|shortlisted|rejected|hired
q=<nome/email do candidato>
limit, offset
order=recent|oldest
```

**200**

```json
{
  "total": 1,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id":"app-uuid","status":"submitted",
      "candidate": { "id","name","email","headline","location","avatarUrl" },
      "job": { "id","title","slug","status","company": { "id","name","slug","verified","ownerId" }, "tags":[...] }
    }
  ]
}
```

---

#### GET `/applications/:id` _(auth)_

Acesso: **candidato dono**, **employer owner da vaga** ou **admin**.

**200**

```json
{
  "application": {
    "id","status",
    "resumeUrl","coverLetterMd","answers",
    "candidate": { "...": "User" },
    "job": { "...": "Job" }
  }
}
```

---

#### PATCH `/applications/:id` _(auth: employer owner | admin)_

Atualiza status.

**Body**

```json
{ "status": "in_review" }
```

**200**

```json
{ "application": { "id","status","updatedAt":"..." } }
```

---

#### DELETE `/applications/:id` _(auth: candidate)_

Remove a própria candidatura **apenas** se `status = submitted`.

**204** (sem body)

---

### Health

#### GET `/health`

Verifica disponibilidade do serviço.

**200**

```json
{ "status": "ok" }
```

---

## Códigos de erro comuns

- `VALIDATION_ERROR` — parâmetros inválidos (Zod).
- `UNAUTHORIZED` — token ausente/ inválido.
- `FORBIDDEN` — sem permissão/ownership.
- `NOT_FOUND` — recurso não localizado.
- `ALREADY_VERIFIED` — empresa já verificada.
- `ALREADY_APPLIED` — candidatura duplicada.
- `JOB_NOT_OPEN` / `JOB_EXPIRED` — vaga indisponível.
- `CANNOT_DELETE` — regra de negócio impede remoção.
- `INTERNAL` — erro inesperado no servidor.

---

## Roadmap / WIP

- **Jobs:** `GET /jobs/:slug`, `PATCH /jobs/:id`, `DELETE /jobs/:id`, bookmark/unbookmark, duplicate.
- **Admin:** fila de moderação (`GET /admin/jobs?status=pending`), `approve` / `reject`.
- **Tags:** `GET /tags`, `GET /tags/popular`.
- **Feeds:** `GET /rss/jobs.xml`, `GET /sitemap.xml`.
- **Auth extra:** `password/forgot`, `password/reset`, `email/verify`.
