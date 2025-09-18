-- ========== SANITY CHECKS ==========
-- A) Jobs 'approved' sem posted_at (violariam a regra de negócio)
SELECT COUNT(*) AS approved_without_posted
FROM jobs
WHERE status = 'approved' AND posted_at IS NULL;

-- B) Duplicatas em bookmarks (mesmo user_id + job_id)
SELECT user_id, job_id, COUNT(*) AS c
FROM bookmarks
GROUP BY 1,2
HAVING COUNT(*) > 1
ORDER BY c DESC
LIMIT 50;

-- C) Duplicatas em job_tags (mesmo job_id + tag_id)
SELECT job_id, tag_id, COUNT(*) AS c
FROM job_tags
GROUP BY 1,2
HAVING COUNT(*) > 1
ORDER BY c DESC
LIMIT 50;

-- D) Orfãos (FKs quebradas) - bookmarks
SELECT COUNT(*) AS bookmarks_orphan_users
FROM bookmarks b
LEFT JOIN users u ON u.id = b.user_id
WHERE u.id IS NULL;

SELECT COUNT(*) AS bookmarks_orphan_jobs
FROM bookmarks b
LEFT JOIN jobs j ON j.id = b.job_id
WHERE j.id IS NULL;

-- E) Orfãos - applications
SELECT COUNT(*) AS applications_orphan_users
FROM applications a
LEFT JOIN users u ON u.id = a.user_id
WHERE u.id IS NULL;

SELECT COUNT(*) AS applications_orphan_jobs
FROM applications a
LEFT JOIN jobs j ON j.id = a.job_id
WHERE j.id IS NULL;

-- F) Orfãos - job_tags
SELECT COUNT(*) AS job_tags_orphan_jobs
FROM job_tags jt
LEFT JOIN jobs j ON j.id = jt.job_id
WHERE j.id IS NULL;

SELECT COUNT(*) AS job_tags_orphan_tags
FROM job_tags jt
LEFT JOIN tags t ON t.id = jt.tag_id
WHERE t.id IS NULL;

-- G) Companies verificadas sem metadata (verified_at/by)
SELECT
  SUM(CASE WHEN verified = TRUE AND verified_at IS NULL THEN 1 ELSE 0 END) AS companies_verified_missing_at,
  SUM(CASE WHEN verified = TRUE AND (verified_by IS NOT NULL)
           AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = companies.verified_by)
      THEN 1 ELSE 0 END) AS companies_verified_invalid_by
FROM companies;

-- H) Slugs duplicados em tags (se ainda não houver UNIQUE em tags.slug)
SELECT slug, COUNT(*) AS c
FROM tags
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY c DESC
LIMIT 50;

-- I) Sanidade de índices (existem e estão sendo usados? rápida inspeção)
-- (Lista índices das tabelas foco)
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('jobs','companies','bookmarks','applications','job_tags','tags')
ORDER BY tablename, indexname;
