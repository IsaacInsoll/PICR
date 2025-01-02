FROM node:23.5-alpine
MAINTAINER Isaac Insoll '<isaac@snibi.com>'
LABEL org.opencontainers.image.source=https://github.com/isaacinsoll/picr

USER node
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node ./dist ./dist
COPY --chown=node:node ./public ./public

EXPOSE 6900

CMD [ "node", "dist/backend/app.js" ]