export default function httpError(status, code, message) {
  const e = new Error(message);
  e.status = status; e.code = code; return e;
}