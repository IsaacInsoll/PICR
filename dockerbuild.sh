#!/bin/bash
commit=$(git rev-parse --short HEAD)
dt=$(date -I)
echo "$commit $dt" > ./dist/version.txt
cd frontend
npm run build
cd ..
npm run build
docker build . -t ghcr.io/isaacinsoll/picr:latest
docker push ghcr.io/isaacinsoll/picr:latest