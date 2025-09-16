import { Sequelize, DataTypes } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: process.env.PGSSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

// ===== Models =====
export const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: DataTypes.TEXT,
  email: { type: DataTypes.TEXT, unique: true },
  password_hash: DataTypes.TEXT,
  role: { type: DataTypes.ENUM("candidate", "employer", "admin"), defaultValue: "candidate" },
  avatar_url: DataTypes.TEXT,
  headline: DataTypes.TEXT,
  location: DataTypes.TEXT,
}, { tableName: "users", underscored: true, timestamps: false });

export const RefreshToken = sequelize.define("RefreshToken", {
  id: { type: DataTypes.UUID, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  token_hash: { type: DataTypes.TEXT, unique: true },
  user_agent: DataTypes.TEXT,
  ip: DataTypes.INET,
  expires_at: DataTypes.DATE,
  revoked_at: DataTypes.DATE,
}, { tableName: "refresh_tokens", underscored: true, timestamps: false });

export const Company = sequelize.define("Company", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: DataTypes.TEXT,
  slug: { type: DataTypes.TEXT, unique: true },
  logo_url: DataTypes.TEXT,
  website: DataTypes.TEXT,
  description_md: DataTypes.TEXT,
  location: DataTypes.TEXT,
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  socials: DataTypes.JSONB,
  owner_id: DataTypes.UUID,
}, { tableName: "companies", underscored: true, timestamps: false });

export const Job = sequelize.define("Job", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  title: DataTypes.TEXT,
  slug: { type: DataTypes.TEXT, unique: true },
  description_md: DataTypes.TEXT,
  employment_type: DataTypes.ENUM("full_time", "part_time", "contract", "internship", "temporary"),
  experience_level: DataTypes.ENUM("junior", "mid", "senior", "lead"),
  salary_min: DataTypes.INTEGER,
  salary_max: DataTypes.INTEGER,
  currency: DataTypes.STRING(3),
  remote: DataTypes.BOOLEAN,
  timezone: DataTypes.TEXT,
  visa_sponsorship: { type: DataTypes.BOOLEAN, defaultValue: false },
  location: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("draft", "pending", "approved", "rejected", "expired"), defaultValue: "pending" },
  featured_until: DataTypes.DATE,
  requirements: DataTypes.ARRAY(DataTypes.TEXT),
  benefits: DataTypes.ARRAY(DataTypes.TEXT),
  posted_at: DataTypes.DATE,
  expires_at: DataTypes.DATE,
}, { tableName: "jobs", underscored: true, timestamps: false });

export const Tag = sequelize.define("Tag", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: DataTypes.TEXT,
  slug: { type: DataTypes.TEXT, unique: true },
  type: { type: DataTypes.ENUM("tech", "role", "seniority", "other"), defaultValue: "tech" },
}, { tableName: "tags", underscored: true, timestamps: false });

export const Application = sequelize.define("Application", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  resume_url: DataTypes.TEXT,
  cover_letter_md: DataTypes.TEXT,
  answers: DataTypes.JSONB,
  status: { type: DataTypes.ENUM("submitted", "in_review", "shortlisted", "rejected", "hired"), defaultValue: "submitted" },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.fn("NOW") },
}, { tableName: "applications", underscored: true, timestamps: false });

export const Bookmark = sequelize.define("Bookmark", {
  user_id: { type: DataTypes.UUID, primaryKey: true },
  job_id: { type: DataTypes.UUID, primaryKey: true },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.fn("NOW") },
}, { tableName: "bookmarks", underscored: true, timestamps: false });

export const JobTag = sequelize.define("JobTag", {}, { tableName: "job_tags", underscored: true, timestamps: false });

// ================== Associations ==================
let associationsInitialized = false;
export function initAssociations() {
  if (associationsInitialized) return;
  associationsInitialized = true;

  // Companies
  User.hasMany(Company, { foreignKey: "owner_id", as: "companies" });
  Company.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

  // Jobs
  Company.hasMany(Job, { foreignKey: "company_id", as: "jobs" });
  Job.belongsTo(Company, { foreignKey: "company_id", as: "company" });

  // Applications
  User.hasMany(Application, { foreignKey: "user_id", as: "applications" });
  Application.belongsTo(User, { foreignKey: "user_id", as: "candidate" });
  Job.hasMany(Application, { foreignKey: "job_id", as: "applications" });
  Application.belongsTo(Job, { foreignKey: "job_id", as: "job" });

  // Tags
  Job.belongsToMany(Tag, { through: JobTag, foreignKey: "job_id", otherKey: "tag_id", as: "tags" });
  Tag.belongsToMany(Job, { through: JobTag, foreignKey: "tag_id", otherKey: "job_id", as: "jobs" });

  // Bookmarks 
  User.belongsToMany(Job, { through: Bookmark, foreignKey: "user_id", otherKey: "job_id", as: "bookmarkedJobs" });
  Job.belongsToMany(User, { through: Bookmark, foreignKey: "job_id", otherKey: "user_id", as: "bookmarkers" });

  // Acessos diretos a partir do Bookmark
  Bookmark.belongsTo(User, { foreignKey: "user_id", as: "user" });
  Bookmark.belongsTo(Job, { foreignKey: "job_id", as: "job" });
}

// health helper
export async function dbHealth() {
  const [res] = await sequelize.query("SELECT 1 as ok");
  return res?.[0]?.ok === 1;
}
