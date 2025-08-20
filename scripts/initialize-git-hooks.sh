#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

cat "$SCRIPT_DIR/hooks/pre-push.sh" > "$PARENT_DIR/.git/hooks/pre-push"
chmod +x "$PARENT_DIR/.git/hooks/pre-push"
