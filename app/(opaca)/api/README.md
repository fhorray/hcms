# /app/api

This is the single entry point for the **Hono** backend using `route.ts`.

All routes and logic are located in `/server/routes/`, and mounted here.

Example:

```ts
// app/api/route.ts
import { handle } from 'hono/vercel';
import { app } from '@/server/routes';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
```
