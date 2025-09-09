// cms/client/hooks/useHcmsApi.ts
'use client';

import { hcmsApi } from '@/cms';
import {
  listAction,
  getAction,
  createAction,
  updateAction,
  removeAction,
} from '@/cms/client/api/actions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type HcmsApi = typeof hcmsApi;

/**
 * Hook CRUD para qualquer tabela registrada no hcmsApi,
 * chamando Server Actions estáticas.
 */
export function useHcmsApi<T extends keyof HcmsApi>(table: T) {
  const qc = useQueryClient();

  // -------- LIST --------
  const useList = (params?: Parameters<HcmsApi[T]['list']>[0]) =>
    useQuery({
      queryKey: ['hcms', table, 'list', params],
      queryFn: () => listAction(table, params),
      select: (res) => res.data, // mantém apenas a lista
    });

  // -------- GET --------
  const useGetOne = (
    id: string | number,
    params?: Parameters<HcmsApi[T]['get']>[1]
  ) =>
    useQuery({
      queryKey: ['hcms', table, 'get', id, params],
      queryFn: () => getAction(table, id, params),
    });

  // -------- CREATE --------
  const create = useMutation({
    mutationFn: (input: Parameters<HcmsApi[T]['create']>[0]) =>
      createAction(table, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hcms', table, 'list'] });
    },
  });

  // -------- UPDATE --------
  const update = useMutation({
    mutationFn: (args: {
      id: string | number;
      input: Parameters<HcmsApi[T]['update']>[1];
    }) => updateAction(table, args.id, args.input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hcms', table, 'list'] });
    },
  });

  // -------- REMOVE --------
  const remove = useMutation({
    mutationFn: (id: string | number) => removeAction(table, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hcms', table, 'list'] });
    },
  });

  return {
    useList,
    useGetOne,
    // já devolve as mutations instanciadas (prontas p/ usar no componente)
    useCreate: create,
    useUpdate: update,
    useRemove: remove,
  };
}
