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
COPY --chown=node:node ./dist ./
RUN npm ci

ENV NODE_ENV=production
ENV PICR_BUILD_CHANNEL=$PICR_BUILD_CHANNEL
ENV PICR_DEVELOPMENT_BUILD_SHA=$PICR_DEVELOPMENT_BUILD_SHA
ENV PICR_GIT_SHA=$PICR_GIT_SHA
EXPOSE 6900

CMD [ "node", "./server/backend/app.js" ]
