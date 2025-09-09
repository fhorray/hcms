// cms/server/actions.ts
'use server';

import { hcmsApi } from "@/cms";


export async function listAction<T extends keyof typeof hcmsApi>(
  table: T,
  params?: Parameters<(typeof hcmsApi)[T]['list']>[0]
) {
  return hcmsApi[table].list(params);
}

export async function getAction<T extends keyof typeof hcmsApi>(
  table: T,
  id: string | number,
  params?: Parameters<(typeof hcmsApi)[T]['get']>[1]
) {
  return hcmsApi[table].get(id, params);
}

export async function createAction<T extends keyof typeof hcmsApi>(
  table: T,
  input: Parameters<(typeof hcmsApi)[T]['create']>[0]
) {
  return hcmsApi[table].create(input);
}

export async function updateAction<T extends keyof typeof hcmsApi>(
  table: T,
  id: string | number,
  input: Parameters<(typeof hcmsApi)[T]['update']>[1]
) {
  return hcmsApi[table].update(id, input);
}

export async function removeAction<T extends keyof typeof hcmsApi>(
  table: T,
  id: string | number
) {
  return hcmsApi[table].remove(id);
}
