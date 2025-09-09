// new-cms/store/opaca.ts
import { atom } from 'nanostores'
import type { SanitizedConfig } from '../config/types'
import { OpacaAPI } from '../api/client'

export type TOpacaState = {
  config: SanitizedConfig
  orm: SanitizedConfig['orm']
  schema: SanitizedConfig['schema']
  collections: SanitizedConfig['collections']
  api: OpacaAPI
}

// store global
export const $opaca = atom<TOpacaState | null>(null)

// inicializador que você chama no server (RootLayout)
export function setOpacaConfig(config: SanitizedConfig) {
  const api = new OpacaAPI(process.env.OPACA_BASE_URL);
  $opaca.set({
    config,
    orm: config.orm,
    schema: config.schema,
    collections: config.collections,
    api,
  })
}
