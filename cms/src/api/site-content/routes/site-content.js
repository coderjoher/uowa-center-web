'use strict';

/**
 * GET /api/site-content?locale=ar|en — the whole site's content for one
 * locale in the shape the Next.js site renders (see the controller). Public
 * and read-only: it only ever returns published entries.
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/site-content',
      handler: 'site-content.find',
      config: { auth: false },
    },
  ],
};
