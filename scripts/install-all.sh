#!/bin/sh

set -e

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  cyan=$(printf '\033[1;36m')
  yellow=$(printf '\033[1;33m')
  reset=$(printf '\033[0m')
else
  cyan=''
  yellow=''
  reset=''
fi

print_title() {
  printf '\n%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$cyan" "$reset"
  printf '%s📦  Installing dependencies for %s%s\n' "$cyan" "$1" "$reset"
  printf '%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n\n' "$cyan" "$reset"
}

print_title 'the repository root (.)'
npm ci

for package in shared backend frontend app ping; do
  print_title "$package/"
  npm --prefix "$package" ci
done

printf '\n%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$yellow" "$reset"
printf '%s🛠️   Preparing compiled backend files%s\n' "$yellow" "$reset"
printf '%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n\n' "$yellow" "$reset"
sh ./copy-backend-files.sh

print_title 'dist/'
npm --prefix dist ci --omit=dev
