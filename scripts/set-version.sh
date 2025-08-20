#!/usr/bin/env bash

# This script sets a version for all defined packages in the Deno workspace.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

function debug {
  # shellcheck disable=SC2059
  >&2 printf "debug: $1\n" "${@:2}"
}

function _deno_json_file {
  local -r dir="$1"
  if [[ -f "$dir/deno.json" ]]; then
    echo "$dir/deno.json"
  elif [[ -f "$dir/deno.jsonc" ]]; then
    echo "$dir/deno.jsonc"
  fi
}

function main {
  local -r new_version="${1}"
  
  workspace_file="$(_deno_json_file "$PARENT_DIR")"
  debug "Using workspace file: $workspace_file"

  cat "$(_deno_json_file "$PARENT_DIR")" | jq -r '.workspace[]' | while read -r package; do
    package_dir="$PARENT_DIR/$package"
    debug "Processing package directory: $package_dir"

    if [[ ! -d "$package_dir" ]]; then
      >&2 echo "error: package directory $package_dir does not exist"
      exit 1
    fi

    deno_json_file="$(_deno_json_file "$package_dir")"

    if [[ -z "$deno_json_file" ]]; then
      >&2 echo "error: no deno.json or deno.jsonc file found in $package_dir"
      exit 1
    fi

    debug "Found file: $deno_json_file"

    cat "$deno_json_file" | jq --arg version "$new_version" '.version = $version' > "$deno_json_file.tmp"
    if [[ $? -ne 0 ]]; then
      rm "$deno_json_file.tmp"
      >&2 echo "error: failed to update version in $deno_json_file"
      exit 1
    fi
    rm "$deno_json_file"
    mv "$deno_json_file.tmp" "$deno_json_file"
    debug "Updated version in $deno_json_file to $new_version"
  done
}

main "$@"
