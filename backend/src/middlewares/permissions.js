import { Company } from "../../db/sequelize.js";

export function ensureCompanyOwner({ from = "params", field = "id" } = {}) {
  return async function (req, res, next) {
    try {
      const uid = req.user?.id;
      const role = req.user?.role;
      if (!uid) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Necessário autenticação.", requestId: req.id } });
      }
      if (role === "admin") return next();

      const companyId = (from === "body" ? req.body?.[field] : req.params?.[field]);
      if (!companyId) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "companyId ausente.", requestId: req.id } });
      }

      const c = await Company.findByPk(companyId, { attributes: ["id", "owner_id"] });
      if (!c) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Empresa não encontrada.", requestId: req.id } });
      }

      if (c.owner_id !== uid) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Você não é o owner desta empresa.", requestId: req.id } });
      }

      return next();
    } catch (e) {
      return next(e);
    }
  };
}


export function ensureJobOwner({ from = "params", field = "id" } = {}) {
  return async function (req, res, next) {
    try {
      const uid = req.user?.id;
      const role = req.user?.role;
      if (!uid) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Necessário autenticação.", requestId: req.id } });
      }
      if (role === "admin") return next();
    } catch (e) {
      next(e);
    }
  }
};