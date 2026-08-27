FROM node:24.13.0-alpine AS build

WORKDIR /build

COPY ping/package.json ping/package-lock.json ./ping/
RUN cd ping && npm ci

COPY tsconfig.base.json ./
COPY shared/package.json ./shared/package.json
COPY shared/banner.ts ./shared/banner.ts
COPY shared/filesystem/ignoredPaths.ts ./shared/filesystem/ignoredPaths.ts
COPY shared/ping/protocol.ts ./shared/ping/protocol.ts
COPY ping/tsconfig.json ping/tsconfig.build.json ./ping/
COPY ping/src ./ping/src

RUN cd ping && npm run build

FROM node:24.13.0-alpine

LABEL org.opencontainers.image.source=https://github.com/isaacinsoll/picr
ARG PICR_GIT_SHA
ARG PICR_PING_VERSION
LABEL org.opencontainers.image.version=$PICR_PING_VERSION
LABEL org.opencontainers.image.revision=$PICR_GIT_SHA

WORKDIR /home/node/app

COPY ping/package.json ping/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /build/ping/dist ./dist

ENV NODE_ENV=production
ENV PICR_PING_VERSION=$PICR_PING_VERSION

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=5m --retries=3 \
  CMD ["node", "-e", "const port=process.env.PING_HEALTH_PORT||'6901';fetch('http://127.0.0.1:'+port+'/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "dist/ping/src/app.js"]
