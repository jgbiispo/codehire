"use strict";

const IDs = {
  nextjs: "66666666-6666-4666-8666-666666666666",
  node: "77777777-7777-4777-8777-777777777777",
  ts: "88888888-8888-4888-8888-888888888888",
  aws: "99999999-9999-4999-8999-999999999999",
  pg: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  react: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  devops: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  k8s: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
};

module.exports = {
  async up(q) {
    await q.bulkInsert("tags", [
      { id: IDs.nextjs, name: "Next.js", slug: "next-js", type: "tech" },
      { id: IDs.node, name: "Node.js", slug: "node-js", type: "tech" },
      { id: IDs.ts, name: "TypeScript", slug: "typescript", type: "tech" },
      { id: IDs.aws, name: "AWS", slug: "aws", type: "tech" },
      { id: IDs.pg, name: "PostgreSQL", slug: "postgresql", type: "tech" },
      { id: IDs.react, name: "React", slug: "react", type: "tech" },
      { id: IDs.devops, name: "DevOps", slug: "devops", type: "tech" },
      { id: IDs.k8s, name: "Kubernetes", slug: "kubernetes", type: "tech" },
    ]);
  },

  async down(q) {
    await q.bulkDelete("tags", null, {});
  },
};
