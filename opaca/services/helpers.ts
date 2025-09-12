// base64-url cursor helpers
export const enc = (v: any) => Buffer.from(JSON.stringify(v)).toString("base64url");
export const dec = <T = any>(s?: string | null): T | null => {
  if (!s) return null;
  try { return JSON.parse(Buffer.from(s, "base64url").toString("utf8")) as T; }
  catch { return null; }
};
