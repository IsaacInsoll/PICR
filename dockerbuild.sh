#!/bin/bash

#stop and remove local container/image
docker stop picr
docker remove picr
docker image remove ghcr.io/isaacinsoll/picr:latest

# embed version in build
commit=$(git rev-parse --short HEAD)
dt=$(date -I)
echo "$commit $dt" > ./dist/version.txt

#front/back builds
cd frontend
npm run build
cd ..
npm run build

#docker build
docker build . -t ghcr.io/isaacinsoll/picr:latest

#sent to GitHub
docker push ghcr.io/isaacinsoll/picr:latest