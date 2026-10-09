module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  // Behind a reverse proxy (Caddy in deploy/), trust its X-Forwarded-* headers
  // so the admin panel's secure cookies work over HTTPS.
  proxy: { koa: env.bool('IS_PROXIED', false) },
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
