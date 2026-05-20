#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JA="$ROOT/_locales/ja/messages.json"
EN="$ROOT/_locales/en/messages.json"

node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ja = JSON.parse(fs.readFileSync(path.join(root, '_locales/ja/messages.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));
const jaKeys = new Set(Object.keys(ja));
const enKeys = new Set(Object.keys(en));
const onlyJa = [...jaKeys].filter((key) => !enKeys.has(key));
const onlyEn = [...enKeys].filter((key) => !jaKeys.has(key));
if (onlyJa.length || onlyEn.length) {
  console.error('i18n key mismatch');
  if (onlyJa.length) console.error('ja only:', onlyJa.join(', '));
  if (onlyEn.length) console.error('en only:', onlyEn.join(', '));
  process.exit(1);
}
NODE
