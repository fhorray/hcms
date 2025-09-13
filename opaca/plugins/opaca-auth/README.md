# opaca-auth

Plugin de autenticação para Opaca usando **Hono**:

- Basic Auth para proteger `/admin/*`
- Bearer token para integrações M2M
- JWT para usuários (verificação via `Authorization: Bearer <token>` **ou** cookie httpOnly)

## Rotas

- `POST /plugins/opaca-auth/login` → Body: `{ email, password }`  
  Emite um JWT (HS256) e define cookie httpOnly `opaca_token`.
- `POST /plugins/opaca-auth/refresh` → Lê cookie atual e reemite JWT.
- `POST /plugins/opaca-auth/logout` → Expira o cookie.
- `GET  /plugins/opaca-auth/me` → Protegida por JWT; retorna dados do usuário (demo).

## Opções

```ts
type OpacaAuthOptions = {
  basePath?: string;
  jwtSecret: string;
  jwtExpiresIn?: number; // default: 86400 (1 day)
  cookieName?: string; // default: "opaca_token"
  cookieDomain?: string;
  cookieSecure?: boolean; // default: true in production
  adminBasic?: { username: string; password: string; realm?: string };
  bearerApiToken?: string;
};
```
