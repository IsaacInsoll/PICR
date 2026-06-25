FROM node:24.13.0-alpine
LABEL org.opencontainers.image.source=https://github.com/isaacinsoll/picr
ARG PICR_BUILD_CHANNEL=release
ARG PICR_DEVELOPMENT_BUILD_SHA
ARG PICR_GIT_SHA
ARG PICR_VERSION
LABEL org.opencontainers.image.version=$PICR_VERSION
LABEL org.opencontainers.image.revision=$PICR_GIT_SHA

RUN apk add --no-cache ffmpeg

USER node
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
# Install dependencies first so this layer caches independently of app code.
# Only package*.json invalidates it, not every code change.
COPY --chown=node:node ./dist/package.json ./dist/package-lock.json ./
RUN npm ci --omit=dev
# Then copy the rest of the build. dist/node_modules is excluded via
# .dockerignore so this COPY can't clobber the Alpine install above.
COPY --chown=node:node ./dist ./

ENV NODE_ENV=production
ENV PICR_BUILD_CHANNEL=$PICR_BUILD_CHANNEL
ENV PICR_DEVELOPMENT_BUILD_SHA=$PICR_DEVELOPMENT_BUILD_SHA
ENV PICR_GIT_SHA=$PICR_GIT_SHA
EXPOSE 6900

CMD [ "node", "./server/backend/app.js" ]
