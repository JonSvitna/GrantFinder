#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_ENV="$ROOT/apps/api/.env"

if [[ ! -f "$API_ENV" ]]; then
  echo "Missing $API_ENV"
  exit 1
fi

echo "GrantFinder admin setup"
echo "Open Supabase settings:"
echo "  Database URI: https://supabase.com/dashboard/project/aohkbfydnpacrddtiiqu/settings/database"
echo "  JWT secret:   https://supabase.com/dashboard/project/aohkbfydnpacrddtiiqu/settings/api"
echo
read -r -p "Paste Supabase DATABASE_URL (URI): " DATABASE_URL
read -r -p "Paste Supabase JWT secret: " JWT_SECRET

tmp="$(mktemp)"
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    DATABASE_URL=*)
      printf 'DATABASE_URL=%s\n' "$DATABASE_URL"
      ;;
    SUPABASE_JWT_SECRET=*)
      printf 'SUPABASE_JWT_SECRET=%s\n' "$JWT_SECRET"
      ;;
    *)
      printf '%s\n' "$line"
      ;;
  esac
done < "$API_ENV" > "$tmp"
mv "$tmp" "$API_ENV"

echo
echo "Updated apps/api/.env"
echo
echo "Add these Auth redirect URLs in Supabase if missing:"
echo "  http://localhost:3001/auth/callback"
echo "  http://localhost:3000/auth/callback"
echo
echo "Restart dev servers, then log in at http://localhost:3001/login"
echo "Admin email: seanmurrill@gmail.com (magic link)"
