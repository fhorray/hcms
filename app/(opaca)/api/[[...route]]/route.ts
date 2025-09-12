import config from "@opaca-config";
import { buildOpacaApi } from "@/opaca/server/api";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { OpacaDbAdapter } from "@/opaca/db/adapter";

const app = new Hono();
app.route("/", buildOpacaApi(config.database?.adapter as OpacaDbAdapter));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);