export type OpacaBetterAuthServerLike = {
  handler: (req: Request) => Response | Promise<Response>;
  api: {
    getSession: (args: {
      headers: Headers;
      query?: Record<string, any>;
    }) => Promise<{ user: unknown; session: unknown } | null>;
  };
  // Correct name:
  utils: {
    ready: () => Promise<void>;
  };
  // Backward-compat if your local type had a typo:
  // Remove this block after you fix your local type.
  utilsts?: {
    ready: () => Promise<void>;
  };
};