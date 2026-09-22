#!/usr/bin/env bash
# Publish Giraffy to giraffy.riverma.com (GitHub Pages, gh-pages branch, site at the root).
# Dry run by default: it builds, checks, and shows exactly what would be pushed.
# Pass --push to actually publish. Nothing is force-pushed without you asking for it.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"
BRANCH="gh-pages"
DOMAIN="giraffy.riverma.com"
PUSH=0
REMOTE="origin"

for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    --remote=*) REMOTE="${arg#*=}" ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "1. Working tree"
if [ -n "$(git status --porcelain)" ]; then
  echo "  uncommitted changes present; commit them first so the deploy matches a commit"
  git status --short
  exit 1
fi
SOURCE_SHA="$(git rev-parse --short HEAD)"
echo "  clean at $SOURCE_SHA"

say "2. Checks"
npm run check
npm test
npm run check-licenses
scripts/audit.sh

say "3. Build"
rm -rf dist
npm run build
npm run check-offline
echo "$DOMAIN" > dist/CNAME
touch dist/.nojekyll
du -sh dist | sed 's/^/  /'

# GitHub Pages serves index.html with max-age=600 and gives us no way to change it, so for
# ten minutes after a deploy a browser can still be running the previous page. If that page
# asks for a file this build does not have, it gets a 404 and shows a blank screen, which is
# exactly what happened on 2026-09-21. Asset names are stable now (vite.config.ts), so this
# should never trigger again; it stays as the belt to that braces, and it costs a few files.
say "3b. Files the last deploy had that this one does not"
git fetch -q "$REMOTE" "$BRANCH" 2>/dev/null || true
if git rev-parse -q --verify "refs/remotes/$REMOTE/$BRANCH" >/dev/null; then
  CARRIED=0
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [ ! -e "dist/$f" ]; then
      mkdir -p "dist/$(dirname "$f")"
      git show "$REMOTE/$BRANCH:$f" > "dist/$f" 2>/dev/null && {
        echo "  carried $f"
        CARRIED=$((CARRIED + 1))
      }
    fi
  done <<< "$(git ls-tree -r --name-only "$REMOTE/$BRANCH" -- assets 2>/dev/null)"
  [ "$CARRIED" -eq 0 ] && echo "  none; this build has everything the last one did"
else
  echo "  no $BRANCH on $REMOTE yet"
fi

say "4. What would be published"
find dist -type f | sed "s|^dist/|  |" | sort

if [ "$PUSH" -ne 1 ]; then
  say "Dry run"
  echo "  Nothing was pushed. Re-run with --push to publish to $REMOTE/$BRANCH."
  echo "  Serve the build locally first:  npx vite preview"
  exit 0
fi

say "5. Publishing to $REMOTE/$BRANCH"
# the lease below is only as fresh as the tracking ref, so fetch first; a brand new
# repository has no gh-pages yet, which is why this is allowed to fail
git fetch -q "$REMOTE" "$BRANCH" 2>/dev/null || echo "  no $BRANCH on $REMOTE yet; this will be the first"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp -R dist/. "$WORK/"
cd "$WORK"
git init -q
git checkout -q -b "$BRANCH"
git add -A
git -c user.useConfigOnly=false commit -q -m "Deploy $SOURCE_SHA"
# gh-pages holds only the built site, so each deploy replaces it wholesale
git push -q --force "$ROOT" "$BRANCH:$BRANCH"
cd "$ROOT"
if git rev-parse -q --verify "refs/remotes/$REMOTE/$BRANCH" >/dev/null; then
  git push "$REMOTE" "$BRANCH" --force-with-lease
else
  git push "$REMOTE" "$BRANCH"
fi
echo "  published. https://$DOMAIN"
