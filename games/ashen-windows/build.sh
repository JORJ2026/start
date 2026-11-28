#!/bin/bash
# Concatenate source parts into a single index.html and syntax-check the script.
# Usage: ./build.sh        (needs node for the syntax check)
set -e
cd "$(dirname "$0")"
mkdir -p build
cat src/[0-9][0-9]_*.js > build/all.js
node --check build/all.js
cat src/00_head.html build/all.js src/99_tail.html > index.html
wc -c index.html | awk '{printf "index.html: %d KB\n", $1/1024}'
wc -l < build/all.js | awk '{printf "script: %d lines\n", $1}'
