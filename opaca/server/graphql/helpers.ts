import { pascalize } from "@/lib/utils";
import { OpacaBaseField, OpacaCollection, OpacaField, OpacaRelatioshipFieldType, OpacaRowFieldType, OpacaSelectFieldType } from "@/opaca/types/config";


function injectMetaFields(fields: any[]) {
  // clone to avoid mutating original
  const out = [...fields];

  const has = (name: string) => out.some((f) => 'name' in f && (f as any).name === name);

  // Ensure id (as required)
  if (!has('id')) {
    out.unshift({ name: 'id', type: 'id', required: true });
  }
  // Ensure created_at / updated_at (nullable to be safe if column doesn't exist)
  if (!has('created_at')) {
    // If you store ISO strings, set type: 'date' and adjust gqlScalar to String
    out.push({ name: 'created_at', type: 'timestamp', required: false });
  }
  if (!has('updated_at')) {
    out.push({ name: 'updated_at', type: 'timestamp', required: false });
  }

  return out;
}

// Map a "type" label to GraphQL scalar explicitly for meta fields
function scalarFor(metaOrBaseType: string): string {
  switch (metaOrBaseType) {
    case 'id':
      return 'ID';
    case 'timestamp':
      return 'Int'; // change to 'String' if you store ISO-8601
    default:
      return 'String';
  }
}

export function buildSDL(cols: OpacaCollection[]) {
  const types = cols.map(col => {
    const t = pascalize(col.name);

    // 1) merge user fields + meta fields
    const merged = injectMetaFields(col.fields);

    // 2) build field lines
    const lines = merged
      .filter(f => 'name' in f && (f as any).name) // skip rows/unnamed
      .map(f => {
        const field = f as OpacaBaseField & { type?: any };
        const fieldName = field.name;

        // Special-case meta fields first
        if (fieldName === 'id') {
          return `  id: ${scalarFor('id')}!`;
        }
        if (fieldName === 'created_at' || fieldName === 'updated_at') {
          // nullable on purpose; won’t break if column not present
          return `  ${fieldName}: ${scalarFor('timestamp')}`;
        }

        // Fallback to your existing mapper
        const fieldType = gqlScalar(field);
        // if gqlScalar returned empty (e.g., row field), skip
        if (!fieldType) return '';
        const required = (field as any).required ? '!' : '';
        return `  ${fieldName}: ${fieldType}${required}`;
      })
      .filter(Boolean)
      .join('\n');

    return `
type ${t} {
${lines}
}
type ${t}Connection {
  nodes: [${t}!]!
  nextCursor: String
}`;
  }).join('\n');

  const queries = cols.map(col => {
    const t = pascalize(col.name);
    // prefer ID for pk
    const pk = 'id';
    return `
  ${col.name}(limit: Int, cursor: String, locale: String): ${t}Connection!
  ${col.name}ById(${pk}: ID!): ${t}
  ${col.name}BySlug(slug: String!): ${t}`;
  }).join('\n');

  const mutations = cols.map(col => {
    const t = pascalize(col.name);
    const pk = 'id';
    return `
  create${t}(data: String!): ${t}
  update${t}(${pk}: ID!, data: String!): ${t}
  delete${t}(${pk}: ID!): Boolean`;
  }).join('\n');

  return `
scalar JSON
scalar Point

${types}

type Query {
${queries}
}

type Mutation {
${mutations}
}
`;
}


// Função para mapear tipos Opaca para GraphQL SDL
export function gqlScalar(field: OpacaField): string {
  // Se for um campo de linha (row), não tem tipo direto no GraphQL
  if ('type' in field && (field.type as OpacaRowFieldType).row) {
    return '';
  }

  const fieldType = (field as OpacaBaseField).type;

  // Tipos primitivos
  if (typeof fieldType === 'string') {
    switch (fieldType) {
      case 'number':
        return 'Int';
      case 'checkbox':
      case 'switcher':
        return 'Boolean';
      case 'date':
      case 'email':
      case 'text':
      case 'textarea':
      case 'rich-text':
      case 'code':
        return 'String';
      case 'json':
        return 'JSON'; // Requer tipo escalar personalizado JSON no GraphQL
      case 'array':
        return '[String]'; // Arrays podem ser mais complexos, ajuste conforme necessário
      case 'upload':
        return 'String'; // Normalmente um URL ou ID do arquivo
      case 'point':
        return 'Point'; // Requer tipo personalizado Point
      case 'blocks':
      case 'collapsible':
      case 'group':
      case 'tabs':
      case 'ui':
        return 'JSON'; // Estruturas complexas mapeadas como JSON
      case 'join':
        return 'String'; // Ajuste conforme o caso de uso
      case 'radio-group':
        return 'String'; // Normalmente armazena o valor selecionado
      default:
        return 'String'; // Fallback
    }
  }

  // Relacionamentos
  if ((fieldType as OpacaRelatioshipFieldType).relationship) {
    const rel = (fieldType as OpacaRelatioshipFieldType).relationship;
    const targetType = pascalize(rel.to as string);
    return rel.many ? `[${targetType}!]` : targetType;
  }

  // Select
  if ((fieldType as OpacaSelectFieldType).select) {
    const sel = (fieldType as OpacaSelectFieldType).select;
    if (sel.relationship) {
      const targetType = pascalize(sel.relationship.to as string);
      return sel.multiple ? `[${targetType}!]` : targetType;
    }
    return sel.multiple ? '[String]' : 'String';
  }

  return 'String'; // Fallback
};
