#! /bin/bash

# embed version in build
commit=$(git rev-parse --short HEAD)
dt=$(date -I)
echo "$commit $dt" > ./public/version.txt

# build frontend
cd frontend && npm run gql && npm run build \

# build backend (with frontend artifact)
cd .. && npm run build && \

# smush into docker hub
docker build . -t isaacinsoll/picr:latest && docker push isaacinsoll/picr:latest

# pop into github container registry
#docker build . -t ghcr.io/isaacinsoll/picr:latest docker push ghcr.io/isaacinsoll/picr:latest