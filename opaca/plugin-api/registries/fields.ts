import { OpacaFieldDescriptor } from "../types";

export class FieldsRegistry {
  private map = new Map<string, OpacaFieldDescriptor>();

  register(def: OpacaFieldDescriptor) {
    const key = def.name.trim();
    if (!key) throw new Error("Field name cannot be empty.");
    if (this.map.has(key)) {
      throw new Error(`Field "${key}" is already registered.`);
    }
    this.map.set(key, def);
  }

  get(name: string): OpacaFieldDescriptor | undefined {
    return this.map.get(name);
  }

  list(): OpacaFieldDescriptor[] {
    return [...this.map.values()];
  }

  /** Used by admin to check availability */
  has(name: string): boolean {
    return this.map.has(name);
  }
}
