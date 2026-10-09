'use strict';

/**
 * Runs once when Strapi starts. Makes sure the two site languages exist,
 * with Arabic as the default, so editors land on the Arabic version of every
 * entry and can switch to English from the locale menu.
 *
 * When SITE_REVALIDATE_URL and REVALIDATE_SECRET are set, it also keeps a
 * webhook that tells the website to refresh whenever content or media changes.
 */
const WEBHOOK_NAME = 'Refresh the website';
const WEBHOOK_EVENTS = [
  'entry.publish',
  'entry.unpublish',
  'entry.delete',
  'media.create',
  'media.update',
  'media.delete',
];

async function ensureSiteWebhook(strapi) {
  const url = process.env.SITE_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;
  const store = strapi.get('webhookStore');
  const runner = strapi.get('webhookRunner');
  const allowed = new Set(store.allowedEvents.values());
  const data = {
    name: WEBHOOK_NAME,
    url,
    headers: { 'x-revalidate-secret': secret },
    events: WEBHOOK_EVENTS.filter((e) => allowed.has(e)),
    isEnabled: true,
  };
  const existing = (await store.findWebhooks()).find((w) => w.name === WEBHOOK_NAME);
  if (existing) runner.update(await store.updateWebhook(existing.id, data));
  else runner.add(await store.createWebhook(data));
}

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    const locales = strapi.plugin('i18n').service('locales');
    const existing = (await locales.find()).map((l) => l.code);
    if (!existing.includes('ar')) await locales.create({ code: 'ar', name: 'Arabic (ar)' });
    if (!existing.includes('en')) await locales.create({ code: 'en', name: 'English (en)' });
    const current = await locales.getDefaultLocale();
    if (current !== 'ar') await locales.setDefaultLocale({ code: 'ar' });
    await ensureSiteWebhook(strapi);
  },
};
