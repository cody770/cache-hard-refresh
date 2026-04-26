#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$ROOT/xcode/Cache Hard Refresh/Cache Hard Refresh"
RES_DIR="$APP_DIR/Resources"
BASE_DIR="$RES_DIR/Base.lproj"

if [ ! -d "$APP_DIR" ]; then
  echo "error: $APP_DIR not found. Run safari-web-extension-converter first." >&2
  exit 1
fi

cp "$ROOT/container/Main.html"        "$BASE_DIR/Main.html"
cp "$ROOT/container/Style.css"        "$RES_DIR/Style.css"
cp "$ROOT/container/Script.js"        "$RES_DIR/Script.js"
cp "$ROOT/container/ViewController.swift" "$APP_DIR/ViewController.swift"

echo "container UI applied:"
echo "  $BASE_DIR/Main.html"
echo "  $RES_DIR/Style.css"
echo "  $RES_DIR/Script.js"
echo "  $APP_DIR/ViewController.swift"
