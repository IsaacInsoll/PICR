#!/usr/bin/env bash

# WIP: i presume this will be "local build" and we will have a github action that will do this same thing but in CI?
# we do want a local version of this for building local container for testing before doing releases?

rm -rf ./dist
mkdir ./dist
cd frontend && npm run build && cd ..
npm run build
cp package*.json ./dist/
cp version.txt ./dist/

mkdir -p ./dist/backend/db/drizzle
cp -r ./backend/db/drizzle ./dist/backend/db

#zip -r dist.zip dist