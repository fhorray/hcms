export type RepoOptions = {
  tableName: string;
  pk: string;
  slug?: string | null;
  orderBy?: { column: string; direction?: "asc" | "desc" } | null;
};