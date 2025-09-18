import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { makeAgent, loginAs } from "./helpers/agent.js";

async function createCompany(agent, name = `TestCo ${Date.now()}`) {
  const payload = {
    name,
    website: "https://example.com",
    location: "Remote",
    descriptionMd: "Empresa de teste",
    socials: { linkedin: "https://linkedin.com/company/example" },
  };
  const res = await agent.post("/companies").send(payload);
  expect(res.status).to.be.oneOf([200, 201]);
  const company = res.body?.company || res.body; // compat
  expect(company?.id).to.be.a("string");
  return company;
}

async function createPendingJob(agent, companyId, opts = {}) {
  const payload = {
    companyId,
    title: opts.title || `QA Engineer ${Date.now()}`,
    descriptionMd: opts.descriptionMd || "Descrição **markdown** da vaga",
    employmentType: "full_time",
    experienceLevel: "mid",
    salaryMin: 10000,
    salaryMax: 15000,
    currency: "BRL",
    remote: true,
    location: "Remote",
    tags: ["qa", "testing"],
  };
  const res = await agent.post("/jobs").send(payload);
  expect(res.status).to.equal(201);
  const job = res.body?.job || {};
  expect(job.id).to.be.a("string");
  expect(job.status).to.be.oneOf(["pending", "approved"]);
  return job;
}

describe("/* ========== ADMIN ========== */", () => {
  it("bloqueia não autenticado em /admin/jobs (401)", async () => {
    const res = await request(app).get("/admin/jobs");
    expect(res.status).to.equal(401);
  });

  it("bloqueia não-admin em /admin/users (403)", async () => {
    const employer = makeAgent();
    await loginAs(employer, "alice@nidus.com", "Password123!"); // seed employer
    const res = await employer.get("/admin/users");
    expect(res.status).to.equal(403);
  });

  it("admin consegue listar /admin/jobs", async () => {
    const admin = makeAgent();
    await loginAs(admin, "admin@codehire.dev", "Password123!");
    const res = await admin.get("/admin/jobs").query({ limit: 10, offset: 0 });
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("object");
    expect(res.body.items).to.be.an("array");
  });

  it("fluxo: employer cria vaga → admin aprova", async () => {
    const employer = makeAgent();
    await loginAs(employer, "alice@nidus.com", "Password123!");

    const company = await createCompany(employer, `Approve Co ${Date.now()}`);
    const job = await createPendingJob(employer, company.id, { title: `Approve Job ${Date.now()}` });

    expect(job.status).to.be.oneOf(["pending", "approved"]);

    const admin = makeAgent();
    await loginAs(admin, "admin@codehire.dev", "Password123!");
    const resApprove = await admin.post(`/admin/jobs/${job.id}/approve`).send({});
    expect(resApprove.status).to.be.oneOf([200]);

    const after = await admin.get("/admin/jobs").query({ limit: 50 });
    expect(after.status).to.equal(200);
    const updated = (after.body.items || []).find((j) => j.id === job.id);
    if (updated) expect(updated.status).to.equal("approved");
  });

  it("fluxo: employer cria vaga → admin rejeita", async () => {
    const employer = makeAgent();
    await loginAs(employer, "alice@nidus.com", "Password123!");

    const company = await createCompany(employer, `Reject Co ${Date.now()}`);
    const job = await createPendingJob(employer, company.id, { title: `Reject Job ${Date.now()}` });

    const admin = makeAgent();
    await loginAs(admin, "admin@codehire.dev", "Password123!");
    const resReject = await admin.post(`/admin/jobs/${job.id}/reject`).send({ reason: "Not enough details" });
    expect(resReject.status).to.be.oneOf([200]);

    const after = await admin.get("/admin/jobs").query({ limit: 50 });
    expect(after.status).to.equal(200);
    const updated = (after.body.items || []).find((j) => j.id === job.id);
    if (updated) expect(updated.status).to.equal("rejected");
  });

  it("admin lista usuários /admin/users", async () => {
    const admin = makeAgent();
    await loginAs(admin, "admin@codehire.dev", "Password123!");
    const res = await admin.get("/admin/users").query({ limit: 20, offset: 0 });
    expect(res.status).to.equal(200);
    expect(res.body.items).to.be.an("array");
    // deve existir pelo menos um admin seed
    const hasAdmin = res.body.items.some((u) => u.role === "admin");
    expect(hasAdmin).to.equal(true);
  });

  it("admin lista empresas /admin/companies", async () => {
    const admin = makeAgent();
    await loginAs(admin, "admin@codehire.dev", "Password123!");
    const res = await admin.get("/admin/companies").query({ limit: 20, offset: 0 });
    expect(res.status).to.equal(200);
    expect(res.body.items).to.be.an("array");
  });
});
