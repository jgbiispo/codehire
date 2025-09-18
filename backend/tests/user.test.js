import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { makeAgent, loginAs } from "./helpers/agent.js";

describe("/* ========== USER ========== */", () => {
  describe("GET /me", () => {
    it("retorna 401 sem autenticação", async () => {
      const res = await request(app).get("/me");
      expect(res.status).to.equal(401);
      expect(res.body?.error?.code).to.equal("UNAUTHORIZED");
    });

    it("retorna os dados do usuário autenticado", async () => {
      const agent = makeAgent();
      await loginAs(agent, "carol@example.com", "Password123!");

      const res = await agent.get("/me");
      expect(res.status).to.equal(200);
      expect(res.body?.user?.id).to.be.a("string");
      expect(res.body?.user?.email).to.equal("carol@example.com");
      expect(res.body?.user?.role).to.equal("candidate");
    });
  });

  describe("PATCH /me", () => {
    it("atualiza headline/location do usuário autenticado", async () => {
      const agent = makeAgent();
      await loginAs(agent, "carol@example.com", "Password123!");

      const payload = {
        name: "Carol Dev",
        headline: "Full-Stack Developer",
        location: "São Paulo, SP",
      };

      const res = await agent.patch("/me").send(payload);
      expect(res.status).to.equal(200);
      expect(res.body?.user?.name).to.equal(payload.name);
      expect(res.body?.user?.headline).to.equal(payload.headline);
      expect(res.body?.user?.location).to.equal(payload.location);

      const me = await agent.get("/me");
      expect(me.status).to.equal(200);
      expect(me.body?.user?.headline).to.equal(payload.headline);
      expect(me.body?.user?.location).to.equal(payload.location);
    });

    it("valida payload inválido (400)", async () => {
      const agent = makeAgent();
      await loginAs(agent, "carol@example.com", "Password123!");

      const invalid = { location: 123 };
      const res = await agent.patch("/me").send(invalid);
      expect(res.status).to.equal(400);
      expect(res.body?.error?.code).to.be.oneOf(["VALIDATION_ERROR", "INVALID_REQUEST"]);
    });
  });

  describe("GET /me/bookmarks", () => {
    it("lista jobs salvos do usuário", async () => {
      const agent = makeAgent();
      await loginAs(agent, "carol@example.com", "Password123!");

      const res = await agent.get("/me/bookmarks").query({ limit: 10, offset: 0 });
      expect(res.status).to.equal(200);

      expect(res.body).to.be.an("object");
      expect(res.body.items).to.be.an("array");

      expect(res.body.items.length).to.be.gte(0);
      if (res.body.items.length > 0) {
        const job = res.body.items[0];
        expect(job).to.have.keys([
          "id",
          "title",
          "slug",
          "location",
          "remote",
          "employmentType",
          "experienceLevel",
          "salary",
          "postedAt",
          "expiresAt",
          "featuredUntil",
          "status",
          "bookmarkedAt",
          "company",
          "tags",
        ].filter(Boolean));
      }
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await request(app).get("/me/bookmarks");
      expect(res.status).to.equal(401);
    });
  });

  describe("GET /me/applications", () => {
    it("lista candidaturas do usuário", async () => {
      const agent = makeAgent();
      await loginAs(agent, "carol@example.com", "Password123!");

      const res = await agent.get("/me/applications").query({ limit: 10, offset: 0 });
      expect(res.status).to.equal(200);

      expect(res.body).to.be.an("object");
      expect(res.body.items).to.be.an("array");

      expect(res.body.items.length).to.be.gte(0);
      if (res.body.items.length > 0) {
        const appItem = res.body.items[0];
        expect(appItem).to.include.keys(["id", "status", "createdAt"]);
      }
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await request(app).get("/me/applications");
      expect(res.status).to.equal(401);
    });
  });
});
