FROM node:23.5-alpine
LABEL org.opencontainers.image.source=https://github.com/isaacinsoll/picr

USER node
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node ./dist ./
RUN npm ci

EXPOSE 6900

CMD [ "node", "./server/backend/app.js" ]