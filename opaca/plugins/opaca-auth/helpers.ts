


// Minimal HS256 encoder using hono/jwt helper (runtime safe)
import { sign } from "hono/jwt";
import { JwtPayload } from "./types";


// Lightweight JWT payload parsing (unsafe, used only for refresh demo)
export function parseJwt(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}



// Helper to issue a signed JWT (HS256)
export async function signJWT(payload: Omit<JwtPayload, "exp">, secret: string, expiresInSec: number) {
  // Use WebCrypto subtle API to sign (Hono JWT helper expects a secret string)
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSec;
  const token = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)); // dummy to keep example async
  // In a real app, use hono/jwt helper encode/sign; here we rely on middleware for verification only.
  // Keep token generation simple and runtime-agnostic by delegating to a tiny encoder below.
  return await encodeJWT({ ...payload, exp }, secret);
}

async function encodeJWT(payload: JwtPayload, secret: string) {
  return await sign(payload, secret);
}


import { parse } from "cookie";
import { Context } from "hono";
import { Next, Variables } from "hono/types";
import { NextRequest } from "next/server";

export type SessionData = {
  userId: string;
  email?: string;
  [key: string]: any;
};

type GetSessionOptions = {
  cookieName?: string;
};

/**
 * Get the session from request cookies
 */
export function getSessionCookie(
  c: Context<{
    Variables: Variables
  }> | NextRequest,
  opts: GetSessionOptions = {}
): SessionData | null {
  const { cookieName = "opaca_token" } = opts;

  let cookieHeader: string | undefined;

  // Hono Context
  if ("req" in c && typeof c.req.header === "function") {
    cookieHeader = c.req.header("cookie");
  }

  // NextRequest (from next/server)
  else if ("headers" in c && typeof c.headers.get === "function") {
    cookieHeader = c.headers.get("cookie") || undefined;
  }

  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  const raw = cookies[cookieName];
  if (!raw) return null;

  try {
    // Caso seja um JSON simples no cookie
    return JSON.parse(raw) as SessionData;
  } catch {
    // Caso seja JWT ou outro formato, você pode adaptar aqui
    return { userId: raw };
  }
}