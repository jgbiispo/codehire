import { getRefreshTokenFromReq, verifyRefreshToken, clearAuthCookies } from "../../lib/jwt.js";
import { RefreshToken } from "../../../db/sequelize.js";

export default async function logout(req, res, next) {
  try {
    const raw = getRefreshTokenFromReq(req);
    if (raw) {
      try {
        const { jti } = verifyRefreshToken(raw);
        await RefreshToken.update({ revoked_at: new Date() }, { where: { id: jti, revoked_at: null } });
      } catch {
        // do nothing if token is invalid/expired
      }
    }
    clearAuthCookies(res);
    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
}
