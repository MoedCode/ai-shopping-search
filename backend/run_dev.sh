#!/bin/bash

# ===============================
# Django Dev Runner
# ===============================

ENV_FILE=${1:-db.env.sh}
HOST=${2:-0.0.0.0}
PORT=${3:-8000}
GITIGNORE=".gitignore"

echo "Using env file: $ENV_FILE"
echo "Server will run on: $HOST:$PORT"

# 1. Check env file existence
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file '$ENV_FILE' not found."
    echo "➡️  Please create it before running the server."
    exit 1
fi

# 2. Ensure env file is ignored by git
if [ ! -f "$GITIGNORE" ]; then
    touch "$GITIGNORE"
fi

if ! grep -qx "$ENV_FILE" "$GITIGNORE"; then
    echo "$ENV_FILE" >> "$GITIGNORE"
    echo "✅ Added '$ENV_FILE' to .gitignore"
else
    echo "ℹ️  '$ENV_FILE' already in .gitignore"
fi

# 3. Source environment variables
set -a
source "$ENV_FILE"
set +a

# 4. Sanity check (optional but smart)
if [ -z "$ASE_DB_NAME" ]; then
    echo "❌ ASE_DB_NAME is not set. Check $ENV_FILE"
    exit 1
fi

# 5. Run Django server
echo "🚀 Starting Django development server..."
python manage.py runserver "$HOST:$PORT"
