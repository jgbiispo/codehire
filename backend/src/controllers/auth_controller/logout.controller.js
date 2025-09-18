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
        console.log("Invalid refresh token on logout");
      }
    }
    clearAuthCookies(res);
    return res.status(204).send();
  } catch (e) {
    console.error("[logout.error]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
  }
}
