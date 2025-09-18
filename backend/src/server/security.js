// src/server/security.js
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

function parseOrigins(envStr) {
  if (!envStr || envStr.trim() === "") return [];
  return envStr.split(",").map(s => s.trim()).filter(Boolean);
}

export function applyHttpHardening(app) {
  const isProd = process.env.NODE_ENV === "production";
  const trustProxy = String(process.env.TRUST_PROXY || "").toLowerCase() === "true";
  const enableCompression = String(process.env.COMPRESSION_ENABLE || "true").toLowerCase() !== "false";
  const allowCredentials = String(process.env.CORS_CREDENTIALS || "").toLowerCase() === "true";
  const cspEnabled = String(process.env.HELMET_CSP || "").toLowerCase() === "true";
  const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS || "");

  if (trustProxy) app.set("trust proxy", 1);

  app.disable("x-powered-by");

  // --- CORS ---
  const corsOptions = allowCredentials
    ? {
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("CORS: Origin não permitido"), false);
      },
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Content-Length", "X-Request-Id"],
      maxAge: 86400,
    }
    : {
      origin: allowedOrigins.length ? allowedOrigins : "*",
      credentials: false,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Content-Length", "X-Request-Id"],
      maxAge: 86400,
    };

  app.use(cors(corsOptions));
  // app.options("*", cors(corsOptions));

  app.use(
    helmet({
      hsts: isProd ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "no-referrer" },
      contentSecurityPolicy: cspEnabled
        ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", ...allowedOrigins],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
        : false,
    })
  );

  // --- Compression ---
  if (enableCompression) {
    app.use(
      compression({
        threshold: 1024,
      })
    );
  }
}
