# The website. Built and run by deploy/docker-compose.yml.
FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM public.ecr.aws/docker/library/node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 MEDIA_DIR=/data/media
# Uploads live here (a volume in deploy/docker-compose.yml), owned by the app user.
RUN mkdir -p /data/media && chown node:node /data/media
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node deploy/site-start.mjs ./
USER node
EXPOSE 3000
CMD ["node", "site-start.mjs"]
