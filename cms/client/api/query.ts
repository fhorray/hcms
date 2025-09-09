// cms/client/query.ts
export type Op = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
export type Primitive = string | number | boolean | null | Date;

function encodeVal(v: Primitive): string {
  if (v instanceof Date) return String(v.getTime());
  if (v === null) return 'null';
  return String(v);
}

export type WhereField =
  | Primitive                                // eq implícito
  | [op: Op, value: Primitive]               // ['gt', 10]
  | { in: Primitive[] }                      // { in: [1,2,3] }
  | { like: string };                        // { like: 'foo' }

export type WhereInput<TCols extends string = string> = Partial<Record<TCols, WhereField>>;

export type ListParams<TCols extends string = string> = {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  orderBy?: TCols;
  select?: TCols[];
  where?: WhereInput<TCols>;
  or?: Array<WhereInput<TCols>>; // grupos OR
};

export function buildQuery<TCols extends string = string>(p: ListParams<TCols> = {}) {
  const sp = new URLSearchParams();

  if (p.limit != null) sp.set('limit', String(p.limit));
  if (p.offset != null) sp.set('offset', String(p.offset));
  if (p.orderBy) sp.set('orderBy', String(p.orderBy));
  if (p.order) sp.set('order', p.order);
  if (p.select?.length) sp.set('select', p.select.join(','));

  // AND (where.*)
  if (p.where) encodeWhereGroup(sp, p.where);

  // OR (or.N.where.*)
  if (p.or?.length) {
    p.or.forEach((group, idx) => encodeWhereGroup(sp, group, `or.${idx}.`));
  }

  return sp;
}

function encodeWhereGroup<TCols extends string>(
  sp: URLSearchParams,
  where: WhereInput<TCols>,
  prefix = ''
) {
  Object.entries(where).forEach(([col, raw]) => {
    if (raw == null) return;

    if (Array.isArray(raw)) {
      const [op, val] = raw as [Op, Primitive];
      sp.set(`${prefix}where.${col}[${op}]`, encodeVal(val));
      return;
    }

    if (typeof raw === 'object' && !(raw instanceof Date)) {
      if ('in' in (raw as any)) {
        const list = (raw as any).in as Primitive[];
        sp.set(`${prefix}where.${col}[in]`, list.map(encodeVal).join(','));
        return;
      }
      if ('like' in (raw as any)) {
        sp.set(`${prefix}where.${col}[like]`, String((raw as any).like));
        return;
      }
    }

    // default eq
    sp.set(`${prefix}where.${col}[eq]`, encodeVal(raw as Primitive));
  });
}
