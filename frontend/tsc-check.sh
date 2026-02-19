#!/bin/bash
# Type-check ratchet: fails CI only if error count increases above baseline.
# To lower the baseline after fixing errors, update tsc-baseline.txt with the new count.
set -euo pipefail

BASELINE_FILE="$(dirname "$0")/tsc-baseline.txt"
BASELINE=$(cat "$BASELINE_FILE" | tr -d '[:space:]')

ERRORS=$(npx tsc --noEmit 2>&1 | grep -c 'error TS' || true)

echo "TypeScript errors: $ERRORS (baseline: $BASELINE)"

if [ "$ERRORS" -gt "$BASELINE" ]; then
  echo "❌ Error count increased! Fix the new errors or update the baseline."
  exit 1
elif [ "$ERRORS" -lt "$BASELINE" ]; then
  echo "✅ Error count decreased! Updating baseline from $BASELINE to $ERRORS."
  echo "$ERRORS" > "$BASELINE_FILE"
else
  echo "✅ Error count unchanged."
fi
