# Strapi CMS. Built and run by deploy/docker-compose.yml.
FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS build
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

FROM public.ecr.aws/docker/library/node:22-bookworm-slim
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /opt/app ./
USER node
EXPOSE 1337
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:1337/_health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["npm", "run", "start"]
