#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 3D Diagram Transformer SaaS - Initializing Container"
echo "=========================================================="

# Automatically synchronize database schema if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Checking PostgreSQL connectivity and synchronizing schema..."
  MAX_RETRIES=30
  COUNT=0

  # Wait for database and push schema
  until ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
      echo "❌ Error: Could not connect to PostgreSQL after $MAX_RETRIES attempts."
      exit 1
    fi
    echo "🔄 Waiting for PostgreSQL to be ready... (attempt $COUNT/$MAX_RETRIES)"
    sleep 2
  done

  echo "✅ Database schema synchronized successfully."

  # Seed initial workspace and architecture templates if requested
  if [ "$AUTO_SEED" = "true" ] || [ -z "$AUTO_SEED" ]; then
    echo "🌱 Checking / seeding initial database templates..."
    if [ -f "prisma/seed.js" ]; then
      node prisma/seed.js 2>/dev/null || true
    fi
  fi
fi

echo "✨ SaaS Engine ready! Listening on port ${PORT:-3000}"
echo "=========================================================="

# Execute the CMD passed to Docker (default: node server.js)
exec "$@"
