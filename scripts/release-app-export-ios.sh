#!/usr/bin/env bash
set -euo pipefail

cd app
npx expo export --platform ios 2>&1 | awk '
  /^› (Assets|ios bundles|android bundles|web bundles|Files) \(/ { skip=1; next }
  skip && NF==0 { skip=0; next }
  skip { next }
  { print }
'
