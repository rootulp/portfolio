#!/bin/sh
# Assemble the static site into dist/. The resume and favicon still live in
# ../public (shared with the Next.js site) until the Next.js code is removed.
set -eu
cd "$(dirname "$0")"
rm -rf dist
cp -R src dist
cp ../public/resume.html ../public/resume.pdf ../public/favicon.ico dist/
