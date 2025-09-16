## Rotas principais

**Auth**

- `POST /api/v1/register` — cria usuário
- `POST /api/v1/login` — autentica (seta cookies HttpOnly)
- `POST /api/v1/refresh` — renova tokens (stub)
- `POST /api/v1/logout` — limpa cookies

**Usuário**

- `GET /api/v1/me` — dados do usuário logado
- `PATCH /api/v1/me` — atualiza perfil
- `GET /api/v1/me/bookmarks` — vagas salvas

**Empresas**

- `POST /api/v1/companies` _(employer/admin)_
- `GET /api/v1/companies`
- `GET /api/v1/companies/:slug`
- `PATCH /api/v1/companies/:id`
- `POST /api/v1/companies/:id/verify` _(admin)_

**Vagas**

- `POST /api/v1/jobs` _(employer/admin)_
- `GET /api/v1/jobs` (filtros: q, tags, senioridade, tipo, remoto, salário…)
- `GET /api/v1/jobs/:slug`
- `PATCH /api/v1/jobs/:id`
- `DELETE /api/v1/jobs/:id`
- `POST /api/v1/jobs/:id/duplicate`
- `POST /api/v1/jobs/:id/bookmark` _(candidate)_
- `DELETE /api/v1/jobs/:id/bookmark` _(candidate)_

**Candidaturas**

- `POST /api/v1/jobs/:id/apply` _(candidate)_
- `GET /api/v1/employer/applications?jobId=...` _(employer/admin)_
- `PATCH /api/v1/applications/:id` _(employer/admin)_

**Tags & Busca**

- `GET /api/v1/tags`
- `GET /api/v1/tags/popular`
- `GET /api/v1/search/jobs` _(opcional, quando usar Meili/Elastic)_

**Feeds & Admin**

- `GET /api/v1/rss/jobs.xml`
- `GET /api/v1/sitemap.xml`
- `GET /api/v1/health`
- `GET /api/v1/admin/jobs?status=pending` _(admin)_
- `POST /api/v1/admin/jobs/:id/approve` _(admin)_
- `POST /api/v1/admin/jobs/:id/reject` _(admin)_

---

## Exemplos de requisição

### Registro

```bash
curl -X POST http://localhost:3000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "Strong#Pass123",
    "role": "candidate"
  }' -i
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{ "email":"joao@example.com", "password":"Strong#Pass123" }' -i
# cookies access_token/refresh_token serão setados
```

### Criar vaga (employer)

```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "uuid-da-empresa",
    "title": "Senior Full-Stack Engineer",
    "descriptionMd": "Stack: Next.js, Node...",
    "employmentType": "full_time",
    "experienceLevel": "senior",
    "salaryMin": 18000,
    "salaryMax": 28000,
    "currency": "BRL",
    "remote": true,
    "timezone": "UTC-3 ±3",
    "location": "Remote",
    "tags": ["nextjs","node","aws"]
  }'
```
