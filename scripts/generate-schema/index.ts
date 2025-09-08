import dotenv from 'dotenv';
dotenv.config({
  path: '.dev.vars'
});

const target = (process.env.CMS_DB || '').toLowerCase();

if (target === 'sqlite' || target === 'sqlite') {
  await import('./generate-schema-sqlite');
} else {
  // default = postgres
  await import('./generate-schema-pg');
}

export { }; 