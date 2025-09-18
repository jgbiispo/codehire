import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { makeAgent, loginAs } from "./helpers/agent.js";

function randEmail() {
  const r = Math.random().toString(36).slice(2, 10);
  return `test_${r}@example.com`;
}

function expectSetCookie(res, atLeast = 1) {
  const cookies = res.headers["set-cookie"];
  expect(cookies, "espera Set-Cookie no header").to.exist;
  expect(cookies.length).to.be.gte(atLeast);
  expect(cookies.some((c) => /httponly/i.test(c))).to.equal(true);
}

describe("/* ========== AUTH ========== */", () => {
  describe("POST /register", () => {
    it("cria usuário candidate por padrão e define cookies", async () => {
      const email = randEmail();
      const res = await request(app).post("/register").send({
        name: "Teste User",
        email,
        password: "Password123!"
      });

      expect(res.status).to.equal(201);
      expect(res.body?.user?.id).to.be.a("string");
      expect(res.body?.user?.role).to.equal("candidate");
      expectSetCookie(res, 2);
    });

    it("recusa e-mail já utilizado (400)", async () => {
      const email = randEmail();
      const a = await request(app).post("/register").send({
        name: "Dup One",
        email,
        password: "Password123!"
      });
      expect(a.status).to.equal(201);

      const b = await request(app).post("/register").send({
        name: "Dup Two",
        email,
        password: "Password123!"
      });
      expect(b.status).to.equal(409);
    });

    it("validação de payload inválido (400)", async () => {
      const res = await request(app).post("/register").send({
        name: "X",
        email: "not-an-email",
        password: "123"
      });
      expect(res.status).to.equal(400);
    });
  });

  describe("POST /login", () => {
    it("admin login devolve 200 e cookies", async () => {
      const agent = makeAgent();
      const res = await agent.post("/login").send({
        email: "admin@codehire.dev",
        password: "Password123!"
      });
      expect(res.status).to.equal(200);
      expect(res.body?.user?.role).to.equal("admin");
      expectSetCookie(res, 2);
    });

    it("employer login devolve 200 e cookies", async () => {
      const agent = makeAgent();
      const res = await agent.post("/login").send({
        email: "alice@nidus.com",
        password: "Password123!"
      });
      expect(res.status).to.equal(200);
      expect(res.body?.user?.role).to.equal("employer");
      expectSetCookie(res, 2);
    });

    it("candidate login devolve 200 e cookies", async () => {
      const agent = makeAgent();
      const res = await agent.post("/login").send({
        email: "carol@example.com",
        password: "Password123!"
      });
      expect(res.status).to.equal(200);
      expect(res.body?.user?.role).to.equal("candidate");
      expectSetCookie(res, 2);
    });

    it("senha inválida retorna 401", async () => {
      const res = await request(app).post("/login").send({
        email: "carol@example.com",
        password: "senha-errada"
      });
      expect(res.status).to.equal(401);
    });
  });

  describe("POST /refresh", () => {
    it("rotaciona tokens (200 + novos cookies)", async () => {
      const agent = makeAgent();
      // faz login para obter refresh httpOnly no cookie
      await loginAs(agent, "carol@example.com", "Password123!");

      const res = await agent.post("/refresh").send({});
      expect(res.status).to.equal(200);
      expectSetCookie(res, 1); // pelo menos um cookie atualizado
    });

    it("sem refresh cookie deve falhar (401/403/400)", async () => {
      const res = await request(app).post("/refresh").send({});
      expect([400, 401, 403]).to.include(res.status);
    });
  });

  describe("POST /logout", () => {
    it("limpa cookies e bloqueia /me depois", async () => {
      const agent = makeAgent();
      await loginAs(agent, "carol@example.com", "Password123!");

      const out = await agent.post("/logout").send({});
      expect([200, 204]).to.include(out.status);

      const me = await agent.get("/me");
      expect(me.status).to.equal(401);
    });
  });
});
