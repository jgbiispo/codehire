function rand(n = 4) {
  return Math.random().toString(36).slice(2, 2 + n);
}

export function slugify(str) {
  return String(str)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uniqueJobSlug(base, t) {
  let s = base || "job";
  let candidate = s;
  let tries = 0;
  while (true) {
    const exists = await Job.findOne({ where: { slug: candidate }, attributes: ["id"], transaction: t });
    if (!exists) return candidate;
    tries += 1;
    candidate = `${s}-${rand(4)}`;
    if (tries > 20) throw new Error("SLUG_COLLISION");
  }
}