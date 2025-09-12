// AUTO-GENERATED FILE — do not edit manually
import { buildDrizzleTable } from "@/cms/helpers/drizzle";
import config from "@opaca-config";
import * as defaultSchema from "./default-sqlite";
export const posts = buildDrizzleTable(config.collections["posts"]);
export const products = buildDrizzleTable(config.collections["products"]);
export const users = buildDrizzleTable(config.collections["users"]);
export const properties = buildDrizzleTable(config.collections["properties"]);
export const logs = buildDrizzleTable(config.collections["logs"]);
export const { sessions, accounts, verifications } = defaultSchema;