'use strict';

const map = require('../../../content-map.json');

const SYSTEM_KEYS = new Set([
  'id',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'locale',
  'localizations',
  'createdBy',
  'updatedBy',
  '__component',
  'sortOrder',
]);

/**
 * Assembles the site's content for one locale from the published entries:
 *
 * - every section single type, deep-populated from its own schema;
 * - `news.items` and `events.items` from their collection types, in
 *   `sortOrder`;
 * - the section switches from the settings single type, as `sections`.
 *
 * Values are turned back into the site's plain shape on the way out:
 * `shared.line` lists become string arrays, media become their URL (kept
 * relative; the site prefixes the CMS origin), empty values are dropped, and
 * Strapi's own bookkeeping fields are stripped. A section with no published
 * entry in this locale is simply left out, so the site falls back to its
 * bundled copy for that section rather than breaking.
 */
module.exports = ({ strapi }) => {
  /** Strapi 5 populate object covering every component and media field. */
  const populateFor = (uid, seen = new Set()) => {
    const model = strapi.getModel(uid);
    const populate = {};
    for (const [key, attr] of Object.entries(model.attributes)) {
      if (attr.type === 'media') populate[key] = true;
      else if (attr.type === 'component') {
        const nested = seen.has(attr.component) ? undefined : populateFor(attr.component, new Set([...seen, uid]));
        populate[key] = nested && Object.keys(nested).length ? { populate: nested } : true;
      }
    }
    return populate;
  };

  /** Convert one value back to the site's shape, guided by its attribute. */
  const clean = (value, attr) => {
    if (value === null || value === undefined) return undefined;
    if (attr && attr.type === 'media') return value.url || undefined;
    if (attr && attr.type === 'component') {
      if (attr.component === 'shared.line') {
        return (value || []).map((l) => l.text ?? '');
      }
      const model = strapi.getModel(attr.component);
      return attr.repeatable ? value.map((v) => cleanEntry(v, model)) : cleanEntry(value, model);
    }
    return value;
  };

  const cleanEntry = (entry, model) => {
    if (!entry) return undefined;
    const out = {};
    for (const [key, value] of Object.entries(entry)) {
      if (SYSTEM_KEYS.has(key)) continue;
      const v = clean(value, model.attributes[key]);
      if (v !== undefined) out[key] = v;
    }
    return out;
  };

  return {
    async find(ctx) {
      const locale = ctx.query.locale === 'en' ? 'en' : 'ar';
      const content = {};

      for (const [key, uid] of Object.entries(map.sections)) {
        const doc = await strapi.documents(uid).findFirst({
          locale,
          status: 'published',
          populate: populateFor(uid),
        });
        if (!doc) continue;
        const section = cleanEntry(doc, strapi.getModel(uid));
        content[key] = map.wrapped.includes(key) ? section.items ?? [] : section;
      }

      for (const [path, uid] of Object.entries(map.collections)) {
        const [key, field] = path.split('.');
        const docs = await strapi.documents(uid).findMany({
          locale,
          status: 'published',
          sort: ['sortOrder:asc', 'id:asc'],
          populate: populateFor(uid),
        });
        if (!content[key]) continue;
        const model = strapi.getModel(uid);
        content[key][field] = docs.map((d) => cleanEntry(d, model));
      }

      const settings = await strapi.documents(map.settings).findFirst({ status: 'published' });
      if (settings) {
        const sections = {};
        for (const key of Object.keys(strapi.getModel(map.settings).attributes)) {
          if (typeof settings[key] === 'boolean') sections[key] = settings[key];
        }
        content.sections = sections;
      }

      ctx.set('Cache-Control', 'no-store');
      ctx.body = content;
    },
  };
};
