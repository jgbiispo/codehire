BEGIN;

-- 1) Jobs 'approved' sem posted_at -> seta agora()
UPDATE jobs
SET posted_at = NOW()
WHERE status = 'approved' AND posted_at IS NULL;

-- 2) Deduplicar bookmarks (mantém o primeiro registro)
DELETE FROM bookmarks b
USING bookmarks b2
WHERE b.user_id = b2.user_id
  AND b.job_id  = b2.job_id
  AND b.ctid    > b2.ctid;

-- 3) Deduplicar job_tags (mantém o primeiro registro)
DELETE FROM job_tags jt
USING job_tags jt2
WHERE jt.job_id = jt2.job_id
  AND jt.tag_id = jt2.tag_id
  AND jt.ctid   > jt2.ctid;

-- 4) Remover órfãos - bookmarks
DELETE FROM bookmarks b
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b.user_id)
   OR NOT EXISTS (SELECT 1 FROM jobs  j WHERE j.id = b.job_id);

-- 5) Remover órfãos - applications
DELETE FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id)
   OR NOT EXISTS (SELECT 1 FROM jobs  j WHERE j.id = a.job_id);

-- 6) Remover órfãos - job_tags
DELETE FROM job_tags jt
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.id = jt.job_id)
   OR NOT EXISTS (SELECT 1 FROM tags t WHERE t.id = jt.tag_id);

-- 7) Companies verificadas sem verified_at -> seta agora()
UPDATE companies
SET verified_at = NOW()
WHERE verified = TRUE AND verified_at IS NULL;

-- 8) Companies com verified_by apontando para user inexistente -> zera (mantém verified)
UPDATE companies c
SET verified_by = NULL
WHERE c.verified = TRUE
  AND c.verified_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.verified_by);

WITH dups AS (
  SELECT slug, MIN(ctid) AS keep_ctid
  FROM tags
  GROUP BY slug
  HAVING COUNT(*) > 1
),
to_fix AS (
  SELECT t.*
  FROM tags t
  JOIN dups d ON t.slug = d.slug
  WHERE t.ctid <> d.keep_ctid
)
-- reatribui job_tags para a tag canônica
UPDATE job_tags jt
SET tag_id = keep.id
FROM to_fix tf
JOIN tags keep ON keep.slug = tf.slug AND keep.ctid = (SELECT keep_ctid FROM dups WHERE slug = tf.slug)
WHERE jt.tag_id = tf.id;

-- renomeia slugs duplicados remanescentes para inspecionar depois
UPDATE tags t
SET slug = slug || '-dup-' || substr(md5(random()::text), 1, 6)
WHERE EXISTS (
  SELECT 1 FROM tags t2 WHERE t2.slug = t.slug AND t2.id <> t.id
);

COMMIT;
