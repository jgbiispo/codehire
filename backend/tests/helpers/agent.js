import request from "supertest";
import app from "../../src/app.js";

export function makeAgent() {
  return request.agent(app);
}

export async function loginAs(agent, email, password) {
  const res = await agent.post("/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login falhou (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body?.user;
}
