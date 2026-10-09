# The website. Built and run by deploy/docker-compose.yml.
FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Read at build time: where the site fetches content, and the public address
# of the CMS (allowed image host and the /admin redirect).
ARG STRAPI_URL
ARG STRAPI_PUBLIC_URL
ENV STRAPI_URL=$STRAPI_URL STRAPI_PUBLIC_URL=$STRAPI_PUBLIC_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM public.ecr.aws/docker/library/node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node deploy/site-start.mjs ./
USER node
EXPOSE 3000
CMD ["node", "site-start.mjs"]
