/**
 * Imports the site's current content into Strapi: uploads every image and
 * video the content references into the media library, then creates and
 * publishes every section (Arabic and English), every news post and course,
 * and the section switches.
 *
 *   npm run seed            # only fills types that are still empty
 *   npm run seed -- --force # replaces everything with the JSON content
 *
 * Stop the Strapi server first; the script boots its own instance. It reads
 * the site's public/ folder next to cms/, or the folder in SEED_SOURCE.
 */
const fs = require("fs");
const path = require("path");
const { createStrapi, compileStrapi } = require("@strapi/strapi");

const SITE = path.resolve(process.env.SEED_SOURCE ?? path.join(__dirname, "..", "..", "public"));
const CONTENT = path.join(SITE, "content");
const map = require("../src/content-map.json");
const FORCE = process.argv.includes("--force");

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function main() {
  const ctx = await compileStrapi();
  const strapi = await createStrapi(ctx).load();
  strapi.log.level = "warn";

  const read = (f) => JSON.parse(fs.readFileSync(path.join(CONTENT, f), "utf8"));
  const content = { ar: read("ar.json"), en: read("en.json") };
  const settings = read("settings.json");

  /* ---- media --------------------------------------------------------- */
  const uploaded = new Map(); // public path -> file id
  const uploadService = strapi.plugin("upload").service("upload");
  const existingFiles = await strapi.db.query("plugin::upload.file").findMany({ select: ["id", "name"] });
  const byName = new Map(existingFiles.map((f) => [f.name, f.id]));

  async function mediaId(publicPath) {
    if (!publicPath) return null;
    if (uploaded.has(publicPath)) return uploaded.get(publicPath);
    const file = path.join(SITE, publicPath);
    if (!fs.existsSync(file)) {
      console.warn(`  ! missing file ${publicPath}`);
      return null;
    }
    const name = publicPath.replace(/^\//, "").replace(/\//g, "__");
    let id = byName.get(name);
    if (!id) {
      const [f] = await uploadService.upload({
        data: { fileInfo: { name, alternativeText: "", caption: "" } },
        files: {
          filepath: file,
          originalFilename: name,
          mimetype: MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
          size: fs.statSync(file).size,
        },
      });
      id = f.id;
      byName.set(name, id);
    }
    uploaded.set(publicPath, id);
    return id;
  }

  /* ---- JSON -> Strapi data, guided by the schema ---------------------- */
  async function toValue(value, attr) {
    if (value === undefined || value === null) return undefined;
    if (attr.type === "media") return await mediaId(value);
    if (attr.type === "component") {
      if (attr.component === "shared.line") return value.map((text) => ({ text }));
      const model = strapi.getModel(attr.component);
      if (attr.repeatable) return Promise.all(value.map((v) => toEntry(v, model)));
      return toEntry(value, model);
    }
    return value;
  }
  async function toEntry(obj, model) {
    const data = {};
    for (const [key, attr] of Object.entries(model.attributes)) {
      if (obj[key] === undefined) continue;
      const v = await toValue(obj[key], attr);
      if (v !== undefined) data[key] = v;
    }
    return data;
  }

  /* ---- writes ------------------------------------------------------- */
  async function wipe(uid) {
    const docs = await strapi.documents(uid).findMany({ locale: "*", status: "draft", fields: ["documentId"] });
    for (const d of docs) await strapi.documents(uid).delete({ documentId: d.documentId, locale: "*" });
  }

  /** Create the Arabic version, add the English one, publish both. */
  async function putBilingual(uid, arData, enData) {
    const created = await strapi.documents(uid).create({ locale: "ar", data: arData });
    if (enData) await strapi.documents(uid).update({ documentId: created.documentId, locale: "en", data: enData });
    await strapi.documents(uid).publish({ documentId: created.documentId, locale: "ar" });
    if (enData) await strapi.documents(uid).publish({ documentId: created.documentId, locale: "en" });
  }

  async function hasAny(uid) {
    return (await strapi.documents(uid).count({ locale: "*" })) > 0;
  }

  const strip = (section, key) => {
    const copy = map.wrapped.includes(key) ? { items: section } : { ...section };
    for (const p of Object.keys(map.collections)) {
      const [sec, field] = p.split(".");
      if (sec === key) delete copy[field];
    }
    return copy;
  };

  for (const [key, uid] of Object.entries(map.sections)) {
    if (await hasAny(uid)) {
      if (!FORCE) {
        console.log(`  = ${key} already has content, skipped`);
        continue;
      }
      await wipe(uid);
    }
    const model = strapi.getModel(uid);
    const arData = await toEntry(strip(content.ar[key], key), model);
    const enData = content.en[key] ? await toEntry(strip(content.en[key], key), model) : undefined;
    await putBilingual(uid, arData, enData);
    console.log(`  + ${key}`);
  }

  for (const [p, uid] of Object.entries(map.collections)) {
    const [key, field] = p.split(".");
    if (await hasAny(uid)) {
      if (!FORCE) {
        console.log(`  = ${p} already has content, skipped`);
        continue;
      }
      await wipe(uid);
    }
    const model = strapi.getModel(uid);
    const arItems = content.ar[key]?.[field] ?? [];
    const enItems = content.en[key]?.[field] ?? [];
    for (let i = 0; i < arItems.length; i++) {
      const arData = { ...(await toEntry(arItems[i], model)), sortOrder: i };
      const enData = enItems[i] ? { ...(await toEntry(enItems[i], model)), sortOrder: i } : undefined;
      await putBilingual(uid, arData, enData);
    }
    console.log(`  + ${p} (${arItems.length})`);
  }

  if (!(await hasAny(map.settings)) || FORCE) {
    if (FORCE) {
      const docs = await strapi.documents(map.settings).findMany({ status: "draft", fields: ["documentId"] });
      for (const d of docs) await strapi.documents(map.settings).delete({ documentId: d.documentId });
    }
    const created = await strapi.documents(map.settings).create({ data: settings.sections });
    await strapi.documents(map.settings).publish({ documentId: created.documentId });
    console.log("  + settings");
  }

  console.log(`Done. ${uploaded.size} media files referenced.`);
  await strapi.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
