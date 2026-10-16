// PACKING THE DESK'S STATE FOR ANOTHER DEVICE. JSON, with the few things
// JSON cannot carry — a Set, a Map, a Date, a RegExp, an infinite number
// — tagged so the far end rebuilds them; functions are dropped, because
// the tablet gets senders in their place. Big slices go over in chunks
// well under any broadcast limit.

export function pack(value: unknown): string {
  return JSON.stringify(value, function (this: Record<string, unknown>, key: string, v: unknown) {
    const raw = this[key];
    if (raw instanceof Date) return { $date: raw.getTime() };
    if (v instanceof Set) return { $set: [...v] };
    if (v instanceof Map) return { $map: [...v] };
    if (v instanceof RegExp) return { $re: [v.source, v.flags] };
    if (typeof v === "function") return undefined;
    if (typeof v === "number" && !Number.isFinite(v)) return { $num: String(v) };
    return v;
  });
}

export function unpack<T = unknown>(json: string): T {
  return JSON.parse(json, (_k: string, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const keys = Object.keys(o);
      if (keys.length === 1) {
        if (Array.isArray(o.$set)) return new Set(o.$set);
        if (Array.isArray(o.$map)) return new Map(o.$map as [unknown, unknown][]);
        if (typeof o.$date === "number") return new Date(o.$date);
        if (Array.isArray(o.$re) && typeof o.$re[0] === "string") return new RegExp(o.$re[0], String(o.$re[1] ?? ""));
        if (typeof o.$num === "string") return Number(o.$num);
      }
    }
    return v;
  }) as T;
}

/** Broadcast payloads stay small: a long slice goes as a run of chunks. */
export const CHUNK_CHARS = 48_000;

export function chunk(s: string): string[] {
  if (s.length <= CHUNK_CHARS) return [s];
  const out: string[] = [];
  for (let i = 0; i < s.length; i += CHUNK_CHARS) out.push(s.slice(i, i + CHUNK_CHARS));
  return out;
}
