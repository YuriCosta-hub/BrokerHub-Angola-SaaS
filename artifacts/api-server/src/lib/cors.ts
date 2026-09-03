import type { RequestHandler } from "express";
import { errorBody } from "./errors";

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function getAllowedOrigins(): string[] | "reflect-dev" {
  const raw = process.env.CORS_ORIGINS;
  if (process.env.NODE_ENV === "production") {
    if (!raw || parseList(raw).length === 0) {
      throw new Error("CORS_ORIGINS is required in production");
    }
    return parseList(raw);
  }
  if (raw && parseList(raw).length > 0) {
    return parseList(raw);
  }
  return "reflect-dev";
}

export function corsGuard(): RequestHandler {
  const allowed = getAllowedOrigins();

  return (req, res, next) => {
    const origin = req.headers.origin;
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Cookie",
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    );

    if (!origin) {
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
      next();
      return;
    }

    const permit =
      allowed === "reflect-dev" || allowed.includes(origin);
    if (!permit) {
      res.status(403).json(
        errorBody("ORIGIN_DENIED", "Origem não permitida"),
      );
      return;
    }

    res.header("Access-Control-Allow-Origin", origin);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  };
}
