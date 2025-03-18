#!/bin/sh
# Copy the language from NostOS into a BML checkout.
#
# The two trees hold the same files at different paths: `src/lang/` here,
# `src/` there. So every hand-copy has to rewrite one import, and forgetting
# it is silent until the tests run — it happened three times in one day, once
# to `bin/bml.js`, where it broke 33 tests at once.
#
#   sh tools/sync-bml.sh /path/to/BML
#
# Copies the language, the REPL, the shared tests and the conformance harness,
# rewriting `../src/lang/X` to `../src/X` on the way. Does not touch the BML
# README, package.json or LICENCE, which are that repository's own.

set -e
DEST="$1"
[ -n "$DEST" ] || { echo "usage: sh tools/sync-bml.sh /path/to/BML" >&2; exit 2; }
[ -d "$DEST/src" ] || { echo "$DEST does not look like a BML checkout (no src/)" >&2; exit 2; }
HERE=$(cd "$(dirname "$0")/.." && pwd)

for f in "$HERE"/src/lang/*.js; do
  cp "$f" "$DEST/src/$(basename "$f")"
done

fix() { sed "s|'\.\./src/lang/|'../src/|g" "$1" > "$2"; }
fix "$HERE/bin/bml.js"                  "$DEST/bin/bml.js"
fix "$HERE/tools/isml-conformance.mjs"  "$DEST/tools/isml-conformance.mjs"
# Both harnesses. This one was hand-copied and therefore free to drift, and a
# measuring instrument that differs between the two trees measures nothing.
fix "$HERE/tools/sml-checklist.mjs"     "$DEST/tools/sml-checklist.mjs"
# NOT examples.test.js. BML's copy has a test NostOS has no use for — that the
# version in its README head matches package.json — and syncing it deleted that
# test the first time this script ran. A file that has deliberately diverged is
# not a file to copy over.
for t in lang-interp bml-repl isml-splitter; do
  [ -f "$HERE/test/$t.test.js" ] && fix "$HERE/test/$t.test.js" "$DEST/test/$t.test.js"
done

echo "synced into $DEST"
echo "still yours to do: package.json version, README, CHANGELOG, then"
echo "  and if this sync CLOSED a gap, take it off the BML vs SML modal in"
echo "  index.html — that list is the page's answer to what SML has and this"
echo "  does not, and nothing checks it but you."
echo "  cd $DEST && node --test test/*.test.js"
