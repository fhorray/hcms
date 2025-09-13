
// Types for plugin options
export type OpacaAuthOptions = {
  basePath?: string;                // Base path for plugin routes
  jwtSecret: string;                // Secret for signing/verifying JWT
  jwtExpiresIn?: number;            // Seconds (default: 60 * 60 * 24)
  cookieName?: string;              // Cookie name (default: "opaca_token")
  cookieDomain?: string;            // Optional cookie domain
  cookieSecure?: boolean;           // Force Secure cookie (defaults to true in production)
  adminBasic?: {                    // Optional Basic Auth to guard admin
    username: string;
    password: string;
    realm?: string;
  };
  bearerApiToken?: string;          // Optional static API token for machine-to-machine
};

export type JwtPayload = {
  sub: string;                      // User id
  email?: string;
  roles?: string[];
  exp?: number;
};
