import { z } from "zod";
import { createHash } from "node:crypto";
import { Job, Company, Tag, sequelize } from "../../../db/sequelize.js";

const qSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const XML = {
  esc(s = "") {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  },
  cdata(s = "") {
    return `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
  },
};

function rfc1123(date = new Date()) {
  return new Date(date).toUTCString(); x
}

function stripMd(md = "") {
  return String(md)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

export default async function rssJobs(req, res) {
  try {
    const { limit } = qSchema.parse(req.query);

    // Somente vagas públicas e vigentes
    const now = new Date();
    const items = await Job.findAll({
      where: sequelize.where(sequelize.literal(`
        status = 'approved'
        AND posted_at IS NOT NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      `), true),
      order: [["posted_at", "DESC"]],
      limit,
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "logo_url", "verified", "location"] },
        { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
      ],
    });

    // Descobre URLs base
    const selfUrl = `${req.protocol}://${req.get("host")}${req.baseUrl || ""}${req.path}`;
    const siteUrl = process.env.PUBLIC_WEB_URL || `${req.protocol}://${req.get("host")}`;

    const channelTitle = "CodeHire — Vagas recentes";
    const channelLink = `${siteUrl}/jobs`;
    const channelDesc = "Últimas vagas publicadas no CodeHire";
    const lastBuild = items[0]?.posted_at || now;

    const xmlItems = items.map((j) => {
      const title = `${j.title} — ${j.company?.name ?? "Empresa"}`;
      const link = `${siteUrl}/jobs/${j.slug}`;
      const guid = link; // permalink
      const pubDate = rfc1123(j.posted_at);
      const company = j.company?.name ?? "";
      const salary =
        j.salary_min != null && j.salary_max != null && j.currency
          ? `Faixa: ${j.salary_min}–${j.salary_max} ${j.currency}`
          : "";
      const location = j.location || (j.remote ? "Remote" : "");
      const summary = stripMd(j.description_md).slice(0, 600);

      const categories = (j.tags || [])
        .map((t) => `    <category>${XML.esc(t.name)}</category>`)
        .join("\n");

      return `
  <item>
    <title>${XML.esc(title)}</title>
    <link>${XML.esc(link)}</link>
    <guid isPermaLink="true">${XML.esc(guid)}</guid>
    <pubDate>${pubDate}</pubDate>
${categories || ""}
    <description>${XML.cdata(
        [
          company && `<strong>Empresa:</strong> ${company}`,
          location && `<strong>Local:</strong> ${location}`,
          salary && `<strong>${salary}</strong>`,
          summary && `<br/><br/>${summary}`,
        ]
          .filter(Boolean)
          .join("<br/>")
      )}</description>
  </item>`;
    }).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${XML.esc(channelTitle)}</title>
    <link>${XML.esc(channelLink)}</link>
    <description>${XML.esc(channelDesc)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${rfc1123(lastBuild)}</lastBuildDate>
    <atom:link href="${XML.esc(selfUrl)}" rel="self" type="application/rss+xml" />
${xmlItems}
  </channel>
</rss>`;

    // Caching básico
    const etag = `W/"${createHash("sha1").update(rss).digest("base64")}"`;
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", new Date(lastBuild).toUTCString());

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    return res.status(200).send(rss);
  } catch (e) {
    console.error("[rss.jobs]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
