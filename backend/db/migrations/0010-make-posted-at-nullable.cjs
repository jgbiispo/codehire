"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE jobs
      ALTER COLUMN posted_at DROP NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'jobs_posted_at_when_approved'
        ) THEN
          ALTER TABLE jobs
          ADD CONSTRAINT jobs_posted_at_when_approved
          CHECK (status <> 'approved' OR posted_at IS NOT NULL);
        END IF;
      END$$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'jobs_posted_at_when_approved'
        ) THEN
          ALTER TABLE jobs DROP CONSTRAINT jobs_posted_at_when_approved;
        END IF;
      END$$;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE jobs
      ALTER COLUMN posted_at SET NOT NULL;
    `);
  },
};
