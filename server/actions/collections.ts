// src/server/actions/collections.ts
'use server';
import 'server-only';

import { eq } from 'drizzle-orm';
import * as schema from '@/server/db/schema';
import { getDb } from '@/server/db';
import type { TableKeys, RowOf, InsertOf, IdOf } from '@/cms/types'


// --------------------------------------
// Server Actions (somente exports de funções async)
// --------------------------------------

export async function listAction<K extends TableKeys>(key: K): Promise<RowOf<K>[]> {
  const db = getDb();
  const table = schema[key] as any;
  const sel = db.select().from(table);
  const rows =
    typeof (sel as any).all === 'function'
      ? await (sel as any).all()
      : await (sel as any);
  return rows as RowOf<K>[];
}

export async function getAction<K extends TableKeys>(key: K, id: IdOf<K>): Promise<RowOf<K> | null> {
  const db = getDb();
  const table = schema[key] as any;
  const q = db.select().from(table).where(eq(table.id, id as any));
  const row =
    typeof (q as any).get === 'function'
      ? await (q as any).get()
      : (await (q as any))[0];
  return (row ?? null) as RowOf<K> | null;
}

export async function createAction<K extends TableKeys>(key: K, data: InsertOf<K>): Promise<RowOf<K>> {
  const db = getDb();
  const table = schema[key] as any;
  const ins = db.insert(table).values(data as any).returning();
  const inserted =
    typeof (ins as any).get === 'function'
      ? await (ins as any).get()
      : (await (ins as any))[0];
  return inserted as RowOf<K>;
}

export async function updateAction<K extends TableKeys>(
  key: K,
  id: IdOf<K>,
  data: Partial<InsertOf<K>>
): Promise<RowOf<K> | null> {
  const db = getDb();
  const table = schema[key] as any;
  const upd = db.update(table).set(data as any).where(eq(table.id, id as any)).returning();
  const updated =
    typeof (upd as any).get === 'function'
      ? await (upd as any).get()
      : (await (upd as any))[0];
  return (updated ?? null) as RowOf<K> | null;
}

export async function removeAction<K extends TableKeys>(key: K, id: IdOf<K>): Promise<RowOf<K> | null> {
  const db = getDb();
  const table = schema[key] as any;
  const del = db.delete(table).where(eq(table.id, id as any)).returning();
  const deleted =
    typeof (del as any).get === 'function'
      ? await (del as any).get()
      : (await (del as any))[0];
  return (deleted ?? null) as RowOf<K> | null;
}
