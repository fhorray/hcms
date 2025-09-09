// new-cms/types-public.ts

export type OpacaCollection = {
  key: string;            // ex: "users"
  ref: object;            // referência ao objeto do Drizzle (tabela) ou model
};

export type OpacaClientOptions = {
  baseUrl?: string;       // ex: "/api/opaca" (default)
  fetch?: typeof globalThis.fetch;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
};

export type OpacaAPI = {
  list<T = unknown>(collection: string, params?: Record<string, any>): Promise<T>;
  get<T = unknown>(collection: string, id: string | number): Promise<T>;
  create<T = unknown>(collection: string, body: any): Promise<T>;
  update<T = unknown>(collection: string, id: string | number, body: any): Promise<T>;
  remove<T = unknown>(collection: string, id: string | number): Promise<T>;
};

export type UseopacaValue = {
  orm: BuiltConfig["orm"];
  schema: BuiltConfig["schema"];
  collections: OpacaCollection[];
  api: OpacaAPI;
  config: BuiltConfig;
  // helpers
  hasCollection: (key: string) => boolean;
};
