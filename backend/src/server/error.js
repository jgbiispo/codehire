import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

export function attachRequestId(req, res, next) {
  const rid = req.get("x-request-id") || randomUUID();
  req.id = rid;
  res.setHeader("X-Request-Id", rid);
  next();
}

export function notFound(req, res, next) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Rota ${req.method} ${req.originalUrl} não encontrada.`,
    },
  });
}

function isSequelizeValidation(err) {
  return err?.name === "SequelizeValidationError" || err?.name === "SequelizeUniqueConstraintError";
}

export function errorHandler(err, req, res, next) {
  const NODE_ENV = process.env.NODE_ENV || "development";
  if (res.headersSent) return next(err);

  // Mapeia status
  const status =
    err.status || err.statusCode ||
    (err instanceof ZodError ? 400 :
      isSequelizeValidation(err) ? 400 :
        500);

  const payload = {
    error: {
      code: err.code || (
        err instanceof ZodError ? "VALIDATION_ERROR" :
          isSequelizeValidation(err) ? "DB_VALIDATION" :
            "INTERNAL"
      ),
      message:
        err.message && !String(err.message).startsWith("[object")
          ? err.message
          : (status === 500 ? "Erro interno." : "Requisição inválida."),
      requestId: req.id,
    },
  };

  if (err instanceof ZodError) {
    payload.error.details = err.errors;
  } else if (isSequelizeValidation(err)) {
    payload.error.details = err.errors?.map(e => ({
      message: e.message,
      path: e.path,
      type: e.type,
      value: e.value,
    }));
  }

  // Log estruturado
  const log = {
    level: status >= 500 ? "error" : "warn",
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    status,
    name: err.name,
    code: payload.error.code,
    stack: NODE_ENV === "development" ? err.stack : undefined,
  };

  if (NODE_ENV === "development") {
    console[status >= 500 ? "error" : "warn"]("[error]", log);
  }

  res.status(status).json(payload);
}
