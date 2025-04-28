#!/usr/bin/env bash

# Github Actions (CI) will do all this automatically so we use this for testing locally

rm -rf ./dist
mkdir ./dist
npm install && npm run build
cd frontend && npm install && npm run build && cd ..
./copy-backend-files.sh

#zip -r dist.zip dist