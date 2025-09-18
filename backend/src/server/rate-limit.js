import rateLimit from "express-rate-limit";

function toInt(v, def) {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : def;
}

function json429(message = "Too many requests", code = "RATE_LIMITED") {
  return (_req, res) => {
    res.status(429).json({
      error: {
        code,
        message,
        retryAfter: res.getHeader("Retry-After") || null,
      },
    });
  };
}

export function applyRateLimiting(app) {
  const generalWindowMs = toInt(process.env.RL_GENERAL_WINDOW_MS, 15 * 60 * 1000); // 15min
  const generalMax = toInt(process.env.RL_GENERAL_MAX, 300);                       // 300 req/15min por IP

  const authWindowMs = toInt(process.env.RL_AUTH_WINDOW_MS, 10 * 60 * 1000);       // 10min
  const authMax = toInt(process.env.RL_AUTH_MAX, 10);                               // 10 tentativas/10min por IP

  const writeWindowMs = toInt(process.env.RL_WRITE_WINDOW_MS, 15 * 60 * 1000);     // 15min
  const writeMax = toInt(process.env.RL_WRITE_MAX, 100);                            // 100 writes/15min por IP

  // Limite geral para toda API 
  const generalLimiter = rateLimit({
    windowMs: generalWindowMs,
    max: generalMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429("Muitas requisições. Tente novamente em instantes.", "RATE_LIMIT_GENERAL"),
  });

  // Limite mais rígido p/ rotas de autenticação
  const authLimiter = rateLimit({
    windowMs: authWindowMs,
    max: authMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429("Muitas tentativas de login/registro. Aguarde um pouco.", "RATE_LIMIT_AUTH"),
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  });

  // Limite para escritas 
  const writeLimiter = rateLimit({
    windowMs: writeWindowMs,
    max: writeMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429("Muitas operações de escrita. Tente novamente em instantes.", "RATE_LIMIT_WRITE"),

    skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  });

  app.use("/api", generalLimiter);
  app.use("/api/register", authLimiter);
  app.use("/api/login", authLimiter);
  app.use("/api/refresh", authLimiter);
  app.use("/api", writeLimiter);
}
