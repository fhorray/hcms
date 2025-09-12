// AUTO-GENERATED FILE — do not edit manually
import { buildDrizzleTable } from "@opaca/builder/build";
import config from "@opaca-config";

const posts = buildDrizzleTable(config.collections.posts);
const products = buildDrizzleTable(config.collections.products);
const users = buildDrizzleTable(config.collections.users);
const properties = buildDrizzleTable(config.collections.properties);

export { posts, products, users, properties };