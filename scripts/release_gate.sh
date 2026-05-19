#!/bin/bash
# Clipnest release gate — any failure stops the release (exit 1).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

pass() {
  PASS=$((PASS + 1))
  echo "  PASS: $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "  FAIL: $1" >&2
}

section() {
  echo ""
  echo "== $1 =="
}

section "npm run lint"
if npm run lint; then
  pass "lint"
else
  fail "lint"
fi

section "npm run typecheck"
if npm run typecheck; then
  pass "typecheck"
else
  fail "typecheck"
fi

section "npm run test:run"
if npm run test:run; then
  pass "test:run"
else
  fail "test:run"
fi

section "summary"
echo "PASS: $PASS  FAIL: $FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  echo "Release gate: BLOCKED" >&2
  exit 1
fi
echo "Release gate: ALL CHECKS PASSED"
exit 0
