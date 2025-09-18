export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status =
    err.status || err.statusCode ||
    (err.name === "ZodError" ? 400 : 500);

  const payload = {
    error: {
      code:
        err.code ||
        (err.name === "ZodError" ? "VALIDATION_ERROR" : "INTERNAL"),
      message:
        err.message && !String(err.message).startsWith("[object")
          ? err.message
          : (status === 500 ? "Erro interno." : "Requisição inválida."),
      requestId: req.id
    },
  };

  if (err.name === "ZodError") payload.error.details = err.errors;

  // log estruturado
  console[status >= 500 ? "error" : "warn"]("[error]", {
    requestId: req.id, method: req.method, url: req.originalUrl,
    status, name: err.name, code: payload.error.code,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  res.status(status).type("application/json").json(payload); // << JSON sempre
}
