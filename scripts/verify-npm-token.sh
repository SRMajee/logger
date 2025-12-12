#!/usr/bin/env bash

set -e

# ------------------------------
# Configuration
# ------------------------------
PACKAGE_NAME="@majee/logger-core"
REGISTRY="https://registry.npmjs.org"

echo "🔍 NPM Publish Token Verification Script"

# ------------------------------
# Validate token presence
# ------------------------------
if [[ -z "$NPM_TOKEN" ]]; then
  echo "❌ ERROR: NPM_TOKEN environment variable is not set."
  echo "Run the script like:"
  echo "    NPM_TOKEN=your_token_here ./verify-npm-token.sh"
  exit 1
fi

# ------------------------------
# Write temporary npmrc
# ------------------------------
TMP_NPMRC=$(mktemp)
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$TMP_NPMRC"

echo "🔐 Using temporary npmrc at: $TMP_NPMRC"

# ------------------------------
# Confirm login status
# ------------------------------
echo "➡️ Checking authentication…"
npm --userconfig "$TMP_NPMRC" whoami || {
  echo "❌ Authentication failed. Invalid or expired token."
  exit 1
}
echo "✅ Authentication successful."

# ------------------------------
# Check publish rights for the scope
# ------------------------------
echo "➡️ Checking publish rights for scope: @majee"

SCOPE_ACL=$(npm --userconfig "$TMP_NPMRC" access ls-collaborators "$PACKAGE_NAME" 2>/dev/null || true)

if [[ "$SCOPE_ACL" == "" ]]; then
  echo "⚠️ The package does not exist yet OR you do not have access."
  echo "Trying to check rights on the scope..."

  npm --userconfig "$TMP_NPMRC" access ls-packages @majee 2>/dev/null || {
    echo "❌ You do NOT have publish permission for @majee scope."
    exit 1
  }

  echo "✅ You appear to have access to the scope."
else
  echo "Collaborators for $PACKAGE_NAME:"
  echo "$SCOPE_ACL"
  echo "✅ Token has some form of access for $PACKAGE_NAME"
fi

# ------------------------------
# Dry-run publish test (safe)
# ------------------------------
echo "➡️ Performing safe publish dry-run…"

npm --userconfig "$TMP_NPMRC" publish --dry-run >/dev/null 2>&1 || {
  echo "⚠️ Publish dry-run failed (expected if run outside a package folder)."
  echo "But the token is valid; publish rights still likely OK."
}

echo "🎉 All checks complete."
