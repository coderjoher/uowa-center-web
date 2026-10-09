import type { Json } from "./api";
import { COLLECTIONS } from "./collections";
import type { Path } from "./Editor";
import type { Route } from "./store";

/**
 * Which screen edits a value at `path` in a language document: an item of
 * a collection, a page in the page builder, or a global.
 */
export function routeForPath(path: Path, draft: Json | undefined): Route {
  const [first] = path;
  if (first === "homeLayout") return { name: "builder", page: "home" };
  if (first === "customPages" && typeof path[1] === "number") {
    const page = Array.isArray((draft as { customPages?: Json[] } | undefined)?.customPages)
      ? ((draft as { customPages: Json[] }).customPages[path[1]] as { slug?: string } | undefined)
      : undefined;
    return { name: "builder", page: page?.slug ?? "home" };
  }
  for (const c of COLLECTIONS) {
    if (c.path.every((p, i) => p === path[i]) && typeof path[c.path.length] === "number") {
      return { name: "item", id: c.id, index: path[c.path.length] as number };
    }
  }
  return { name: "global", key: String(first) };
}

export const sameRoute = (a: Route, b: Route) => JSON.stringify(a) === JSON.stringify(b);

/** The path of the first value equal to `value` (e.g. a picture's address), preferring ones under `within`. */
export function findPathOf(doc: Json | undefined, value: string, within: Path = []): Path | null {
  let fallback: Path | null = null;
  const walk = (node: Json | undefined, path: Path): Path | null => {
    if (typeof node === "string") {
      if (node === value) {
        if (within.every((p, i) => p === path[i])) return path;
        fallback ??= path;
      }
      return null;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const hit = walk(node[i], [...path, i]);
        if (hit) return hit;
      }
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const hit = walk(v, [...path, k]);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(doc, []) ?? fallback;
}
