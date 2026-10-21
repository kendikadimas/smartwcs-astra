import pino from "pino";
import { env } from "./env";

// Diekspor terpisah dari instance `logger` supaya test bisa membuat
// instance pino lain dengan redaksi yang sama tapi destination kustom
// (tanpa tersandung worker thread transport pino-pretty).
export const loggerOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "authorization",
      "*.authorization",
      "signature",
      "*.signature",
      "apiAppSecret",
      "*.apiAppSecret",
      "password",
      "*.password",
      "token",
      "*.token",
      "callbackCode",
      "*.callbackCode",
    ],
    censor: "[REDACTED]",
  },
};

// Server-only: jangan import dari Client Component.
export const logger = pino(
  loggerOptions,
  env.NODE_ENV === "production"
    ? undefined
    : pino.transport({ target: "pino-pretty", options: { colorize: true } }),
);
