/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const qi = queryInterface;
    const sql = (s) => qi.sequelize.query(s);

    // --- companies: verified_at / verified_by ---
    await sql(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS verified_by UUID;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE companies
          ADD CONSTRAINT companies_verified_by_fkey
          FOREIGN KEY (verified_by) REFERENCES users(id)
          ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    // --- jobs: posted_at nullable + CHECK(status/postado) ---
    await sql(`ALTER TABLE jobs ALTER COLUMN posted_at DROP NOT NULL;`);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE jobs
          ADD CONSTRAINT jobs_approved_requires_posted_at
          CHECK (status <> 'approved' OR posted_at IS NOT NULL);
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    // --- uniques de slug ---
    await sql(`CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_key ON jobs (slug);`);
    await sql(`CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_key ON companies (slug);`);

    // --- índices de performance ---
    await sql(`CREATE INDEX IF NOT EXISTS jobs_status_posted_at_idx ON jobs (status, posted_at DESC);`);
    await sql(`CREATE INDEX IF NOT EXISTS jobs_company_status_idx ON jobs (company_id, status);`);
    await sql(`CREATE INDEX IF NOT EXISTS job_tags_job_id_idx ON job_tags (job_id);`);
    await sql(`CREATE INDEX IF NOT EXISTS job_tags_tag_id_idx ON job_tags (tag_id);`);
    await sql(`CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks (user_id);`);
    await sql(`CREATE INDEX IF NOT EXISTS bookmarks_job_id_idx ON bookmarks (job_id);`);
    await sql(`CREATE INDEX IF NOT EXISTS applications_user_id_idx ON applications (user_id);`);
    await sql(`CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications (job_id);`);

    // --- Unicidade nas tabelas de junção (sem PK composta) ---
    await sql(`
      CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_job_uniq_idx
      ON bookmarks (user_id, job_id);
    `);

    await sql(`
      CREATE UNIQUE INDEX IF NOT EXISTS job_tags_job_tag_uniq_idx
      ON job_tags (job_id, tag_id);
    `);

    // --- FKs com ON DELETE ---
    await sql(`
      DO $$
      BEGIN
        ALTER TABLE jobs
          ADD CONSTRAINT jobs_company_id_fkey
          FOREIGN KEY (company_id) REFERENCES companies(id)
          ON DELETE RESTRICT;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE bookmarks
          ADD CONSTRAINT bookmarks_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE bookmarks
          ADD CONSTRAINT bookmarks_job_id_fkey
          FOREIGN KEY (job_id) REFERENCES jobs(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE applications
          ADD CONSTRAINT applications_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE applications
          ADD CONSTRAINT applications_job_id_fkey
          FOREIGN KEY (job_id) REFERENCES jobs(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE job_tags
          ADD CONSTRAINT job_tags_job_id_fkey
          FOREIGN KEY (job_id) REFERENCES jobs(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);

    await sql(`
      DO $$
      BEGIN
        ALTER TABLE job_tags
          ADD CONSTRAINT job_tags_tag_id_fkey
          FOREIGN KEY (tag_id) REFERENCES tags(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END$$;
    `);
  },

  async down(queryInterface) {
    const qi = queryInterface;
    const sql = (s) => qi.sequelize.query(s);

    // Remover FKs (best-effort)
    await sql(`DO $$ BEGIN ALTER TABLE companies    DROP CONSTRAINT IF EXISTS companies_verified_by_fkey; EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE jobs         DROP CONSTRAINT IF EXISTS jobs_company_id_fkey;         EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE bookmarks    DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;       EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE bookmarks    DROP CONSTRAINT IF EXISTS bookmarks_job_id_fkey;        EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_user_id_fkey;    EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_job_id_fkey;     EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE job_tags     DROP CONSTRAINT IF EXISTS job_tags_job_id_fkey;         EXCEPTION WHEN others THEN NULL; END$$;`);
    await sql(`DO $$ BEGIN ALTER TABLE job_tags     DROP CONSTRAINT IF EXISTS job_tags_tag_id_fkey;         EXCEPTION WHEN others THEN NULL; END$$;`);

    // Remover índices
    await sql(`DROP INDEX IF EXISTS jobs_slug_key;`);
    await sql(`DROP INDEX IF EXISTS companies_slug_key;`);
    await sql(`DROP INDEX IF EXISTS jobs_status_posted_at_idx;`);
    await sql(`DROP INDEX IF EXISTS jobs_company_status_idx;`);
    await sql(`DROP INDEX IF EXISTS job_tags_job_id_idx;`);
    await sql(`DROP INDEX IF EXISTS job_tags_tag_id_idx;`);
    await sql(`DROP INDEX IF EXISTS bookmarks_user_id_idx;`);
    await sql(`DROP INDEX IF EXISTS bookmarks_job_id_idx;`);
    await sql(`DROP INDEX IF EXISTS applications_user_id_idx;`);
    await sql(`DROP INDEX IF EXISTS applications_job_id_idx;`);
    await sql(`DROP INDEX IF EXISTS bookmarks_user_job_uniq_idx;`);
    await sql(`DROP INDEX IF EXISTS job_tags_job_tag_uniq_idx;`);

    // Remover CHECK
    await sql(`DO $$ BEGIN ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_approved_requires_posted_at; EXCEPTION WHEN others THEN NULL; END$$;`);

    // Remover colunas de verificação (best-effort)
    await sql(`ALTER TABLE companies DROP COLUMN IF EXISTS verified_at;`);
    await sql(`ALTER TABLE companies DROP COLUMN IF EXISTS verified_by;`);

  }
};
