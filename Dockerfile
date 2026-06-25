FROM node:24.13.0-alpine
LABEL org.opencontainers.image.source=https://github.com/isaacinsoll/picr
ARG PICR_BUILD_CHANNEL=release
ARG PICR_DEVELOPMENT_BUILD_SHA
ARG PICR_GIT_SHA
ARG PICR_VERSION
# Provided automatically by buildx; used to gate VAAPI drivers to amd64 only.
ARG TARGETARCH
LABEL org.opencontainers.image.version=$PICR_VERSION
LABEL org.opencontainers.image.revision=$PICR_GIT_SHA

# ffmpeg is required on every arch. VAAPI hardware-acceleration drivers
# (mesa-va-gallium = AMD/Intel Gallium, intel-media-driver = Intel Gen8+,
# libva-utils = vainfo for troubleshooting) are added on amd64 only: arm64
# hosts rarely have a usable VAAPI GPU, so they stay byte-for-byte unchanged.
# Acceleration is still opt-in at runtime (requires /dev/dri + VIDEO_ACCELERATION).
RUN apk add --no-cache ffmpeg && \
    if [ "$TARGETARCH" = "amd64" ]; then \
      apk add --no-cache mesa-va-gallium intel-media-driver libva-utils; \
    fi

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
