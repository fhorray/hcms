import { handle } from 'hono/vercel';

// app/api/route.ts
import api from '@/server';

export const GET = handle(api);
export const POST = handle(api);
export const PUT = handle(api);
export const DELETE = handle(api);
export const PATCH = handle(api);
export const OPTIONS = handle(api);