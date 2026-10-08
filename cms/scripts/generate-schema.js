/**
 * Generates the Strapi content model from the site's own content files
 * (../public/content/{ar,en}.json), so the CMS always matches what the site
 * renders. Run it after changing the shape of the content:
 *
 *   npm run generate-schema
 *
 * Mapping
 * - Each top-level section (hero, about, footer, …) becomes a localized
 *   single type `api::<key>-section.<key>-section`, with draft & publish.
 * - `news.items` and `events.items` become localized collection types
 *   (`news-post`, `course`) with a `sortOrder`, since each has its own page.
 * - Nested objects become components, arrays of objects repeatable
 *   components (category = the section, name = the path), and arrays of
 *   strings the shared repeatable `shared.line` ({ text }).
 * - Strings named image/poster become image fields, the video section's
 *   src/srcWebm video fields; long strings become multi-line text.
 * - Section switches (settings.json) become the `site-setting` single type.
 *
 * Content types and components carry Arabic display names from
 * labels.json; field names keep the content's own keys, which the site and
 * the site-content endpoint rely on.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.resolve(ROOT, "..", "public", "content");
const labels = require("./labels.json");
const IMAGE_KEYS = new Set(labels.imageKeys);
const LONG_KEYS = new Set(labels.longKeys);
const VIDEO_KEYS = new Set(["src", "srcWebm"]);

const COLLECTIONS = {
  "news.items": { singular: "news-post", plural: "news-posts", label: labels.sections["news-post"] },
  "events.items": { singular: "course", plural: "courses", label: labels.sections["course"] },
};

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
const snake = (s) => kebab(s).replace(/-/g, "_");
const label = (key) => labels.fields[key] ?? labels.sections[key] ?? key;
const LOCALIZED = { i18n: { localized: true } };

const components = new Map(); // uid -> schema

/** Merge every observed value of a field (across locales and list items). */
function infer(values, ctx) {
  const vals = values.filter((v) => v !== undefined && v !== null);
  const { key, category, trail } = ctx;
  if (!vals.length) return { type: "string" };
  if (vals.every((v) => typeof v === "string")) {
    if (ctx.section === "video" && VIDEO_KEYS.has(key)) {
      return { type: "media", multiple: false, allowedTypes: ["videos"] };
    }
    if (IMAGE_KEYS.has(key)) return { type: "media", multiple: false, allowedTypes: ["images"] };
    const long = LONG_KEYS.has(key) || vals.some((v) => v.length > 90 || v.includes("\n"));
    return { type: long ? "text" : "string" };
  }
  if (vals.every((v) => typeof v === "boolean")) return { type: "boolean" };
  if (vals.every((v) => typeof v === "number")) {
    return { type: vals.every(Number.isInteger) ? "integer" : "decimal" };
  }
  if (vals.every(Array.isArray)) {
    const items = vals.flat();
    if (!items.length || items.every((v) => typeof v === "string")) {
      return { type: "component", repeatable: true, component: "shared.line" };
    }
    const uid = defineComponent(items, { ...ctx, trail: [...trail, key] });
    return { type: "component", repeatable: true, component: uid };
  }
  if (vals.every((v) => typeof v === "object" && !Array.isArray(v))) {
    const uid = defineComponent(vals, { ...ctx, trail: [...trail, key] });
    return { type: "component", repeatable: false, component: uid };
  }
  throw new Error(`Mixed value types at ${category}.${[...trail, key].join(".")}`);
}

/** Attributes for a set of objects with (possibly) differing keys. */
function attributesFor(objects, ctx) {
  const keys = [];
  for (const o of objects) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
  const attrs = {};
  for (const k of keys) attrs[k] = infer(objects.map((o) => o[k]), { ...ctx, key: k });
  return attrs;
}

function defineComponent(objects, ctx) {
  const name = kebab(ctx.trail.join("-"));
  const uid = `${ctx.category}.${name}`;
  const attributes = attributesFor(objects, { ...ctx });
  const last = ctx.trail[ctx.trail.length - 1];
  components.set(uid, {
    collectionName: `components_${snake(ctx.category)}_${snake(name)}`,
    info: { displayName: label(last), icon: "bulletList", description: ctx.trail.join(" › ") },
    options: {},
    attributes,
  });
  return uid;
}

function localize(attrs) {
  const out = {};
  for (const [k, a] of Object.entries(attrs)) out[k] = { ...a, pluginOptions: LOCALIZED };
  return out;
}

function writeApi(singular, plural, kind, displayName, attributes, localized = true) {
  const dir = path.join(ROOT, "src", "api", singular);
  const uid = `api::${singular}.${singular}`;
  fs.mkdirSync(path.join(dir, "content-types", singular), { recursive: true });
  fs.mkdirSync(path.join(dir, "controllers"), { recursive: true });
  fs.mkdirSync(path.join(dir, "routes"), { recursive: true });
  fs.mkdirSync(path.join(dir, "services"), { recursive: true });
  const schema = {
    kind,
    collectionName: snake(plural),
    info: { singularName: singular, pluralName: plural, displayName },
    options: { draftAndPublish: true },
    pluginOptions: localized ? LOCALIZED : {},
    attributes: localized ? localize(attributes) : attributes,
  };
  fs.writeFileSync(path.join(dir, "content-types", singular, "schema.json"), JSON.stringify(schema, null, 2) + "\n");
  for (const [sub, fn] of [["controllers", "createCoreController"], ["routes", "createCoreRouter"], ["services", "createCoreService"]]) {
    fs.writeFileSync(
      path.join(dir, sub, `${singular}.js`),
      `'use strict';\n\n// Generated by scripts/generate-schema.js\nconst { factories } = require('@strapi/strapi');\n\nmodule.exports = factories.${fn}('${uid}');\n`,
    );
  }
  return uid;
}

/* ---------------------------------------------------------------------- */
const ar = JSON.parse(fs.readFileSync(path.join(SITE, "ar.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(SITE, "en.json"), "utf8"));
const settings = JSON.parse(fs.readFileSync(path.join(SITE, "settings.json"), "utf8"));

// Start clean: generated APIs and components only (the hand-written
// site-content API is left alone).
const apiDir = path.join(ROOT, "src", "api");
for (const d of fs.existsSync(apiDir) ? fs.readdirSync(apiDir) : []) {
  if (d !== "site-content") fs.rmSync(path.join(apiDir, d), { recursive: true, force: true });
}
fs.rmSync(path.join(ROOT, "src", "components"), { recursive: true, force: true });

components.set("shared.line", {
  collectionName: "components_shared_lines",
  info: { displayName: "سطر / فقرة", icon: "align-left", description: "One line or paragraph of a list" },
  options: {},
  attributes: { text: { type: "text" } },
});

const map = { sections: {}, wrapped: [], collections: {}, settings: "api::site-setting.site-setting" };

for (const key of Object.keys(ar)) {
  // A section that is a bare list (features) is stored as { items: [...] }
  // and unwrapped again by the site-content endpoint.
  const wrap = Array.isArray(ar[key]);
  if (wrap) map.wrapped.push(key);
  const section = wrap ? { items: ar[key] } : { ...ar[key] };
  const sectionEn = wrap ? { items: en[key] } : { ...en[key] };
  if (!wrap && (typeof ar[key] !== "object" || ar[key] === null)) {
    throw new Error(`Top-level ${key} is neither an object nor a list`);
  }
  const singular = `${kebab(key)}-section`;
  let attrs;
  // Split collection-backed lists out of their section.
  for (const [p, c] of Object.entries(COLLECTIONS)) {
    const [sec, field] = p.split(".");
    if (sec !== key) continue;
    const items = [...(section[field] ?? []), ...(sectionEn[field] ?? [])];
    delete section[field];
    delete sectionEn[field];
    const itemAttrs = attributesFor(items, { section: key, category: kebab(key), trail: [] });
    itemAttrs.sortOrder = { type: "integer" };
    map.collections[p] = writeApi(c.singular, c.plural, "collectionType", c.label, itemAttrs);
  }
  attrs = attributesFor([section, sectionEn], { section: key, category: kebab(key), trail: [] });
  map.sections[key] = writeApi(singular, `${kebab(key)}-sections`, "singleType", labels.sections[key] ?? key, attrs);
}

const settingAttrs = {};
for (const k of Object.keys(settings.sections)) settingAttrs[k] = { type: "boolean", default: true };
writeApi("site-setting", "site-settings", "singleType", labels.sections.settings, settingAttrs, false);

for (const [uid, schema] of components) {
  const [category, name] = uid.split(".");
  const dir = path.join(ROOT, "src", "components", category);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(schema, null, 2) + "\n");
}

fs.writeFileSync(path.join(ROOT, "src", "content-map.json"), JSON.stringify(map, null, 2) + "\n");
console.log(
  `Generated ${Object.keys(map.sections).length} sections, ${Object.keys(map.collections).length} collections, 1 settings type, ${components.size} components.`,
);
