import { pascalize, slugify } from "@/lib/utils";
import { OpacaCollection } from "@opaca/types/config";
import { graphqlServer, type RootResolver } from "@hono/graphql-server";

export const makeRoot =
  (cols: OpacaCollection[]): RootResolver =>
    (c) => {
      const services = c.get("services") as Record<string, any>;

      const root: Record<string, any> = {};
      const parse = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };

      for (const col of cols) {
        const colName = slugify(col.name);
        const t = pascalize(colName);
        const pk = "id";
        const svc = services[colName]
          ;

        root[t] = async (args: any) => {
          const { items, nextCursor } = await svc.list(args ?? {});
          return { nodes: items, nextCursor: nextCursor ?? null };
        };
        root[`${colName}ById`] = (args: any) => svc.getById(String(args[pk]));
        root[`${colName}BySlug`] = (args: any) => (svc.getBySlug ? svc.getBySlug(String(args.slug)) : null);

        root[`create${t}`] = (args: any) => svc.create(parse(args.data));
        root[`update${t}`] = (args: any) => svc.update(String(args[pk]), parse(args.data));
        root[`delete${t}`] = async (args: any) => {
          await svc.remove(String(args[pk]));
          return true;
        };
      }

      return root;
    };