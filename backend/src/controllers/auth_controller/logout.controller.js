import { getRefreshTokenFromReq, verifyRefreshToken, clearAuthCookies } from "../../lib/jwt.js";
import { RefreshToken } from "../../../db/sequelize.js";

export default async function logout(req, res) {
  try {
    const raw = getRefreshTokenFromReq(req);
    if (raw) {
      try {
        const { jti } = verifyRefreshToken(raw);
        await RefreshToken.update({ revoked_at: new Date() }, { where: { id: jti, revoked_at: null } });
      } catch {
        // token inválido/expirado — apenas limpe cookies TODO
      }
    }
    clearAuthCookies(res);
    return res.status(204).send();
  } catch (e) {
    console.error("[logout]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
  }
}
