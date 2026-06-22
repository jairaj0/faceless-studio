#!/usr/bin/env bash
# Save a build stage: stage all changes, commit, optional tag, and try to push.
# Usage:  ./save-stage.sh "commit message" [tag-name]
# Examples:
#   ./save-stage.sh "M2: engine + monitor" studio-m2
#   ./save-stage.sh "wip: timeline drag"
set -e
cd "$(dirname "$0")"

MSG="${1:-progress}"
TAG="$2"

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit."
else
  git commit -m "$MSG

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  echo "Committed: $MSG"
fi

if [ -n "$TAG" ]; then
  git tag -f -a "$TAG" -m "$MSG"
  echo "Tagged: $TAG"
fi

# Push (works in your terminal where GitHub auth exists; no-ops otherwise).
if git remote get-url origin >/dev/null 2>&1; then
  if git push && git push --tags --force; then
    echo "Pushed to origin ✅"
  else
    echo "(committed locally — run 'git push' when online/authed)"
  fi
else
  echo "(no remote yet — add one: git remote add origin <url>, then git push -u origin main)"
fi
