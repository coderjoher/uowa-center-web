'use strict';

/**
 * Runs once when Strapi starts. Makes sure the two site languages exist,
 * with Arabic as the default, so editors land on the Arabic version of every
 * entry and can switch to English from the locale menu.
 */
module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    const locales = strapi.plugin('i18n').service('locales');
    const existing = (await locales.find()).map((l) => l.code);
    if (!existing.includes('ar')) await locales.create({ code: 'ar', name: 'Arabic (ar)' });
    if (!existing.includes('en')) await locales.create({ code: 'en', name: 'English (en)' });
    const current = await locales.getDefaultLocale();
    if (current !== 'ar') await locales.setDefaultLocale({ code: 'ar' });
  },
};
