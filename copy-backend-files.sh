#!/usr/bin/env bash

# The release artifact has a few files added after the frontend and backend builds
# They are here so we can use the same list locally for development and in github CI

cp ./backend/package*.json ./dist/
cp version.txt ./dist/

mkdir -p ./dist/backend/db/drizzle
cp -r ./backend/db/drizzle ./dist/backend/db
