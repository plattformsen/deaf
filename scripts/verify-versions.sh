#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

function debug {
  # shellcheck disable=SC2059
  >&2 printf "debug: $1\n" "${@:2}"
}

function error {
  # shellcheck disable=SC2059
  >&2 printf "\x1b[31merror: $1\n\x1b[0m" "${@:2}"
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
  local -r expected_version="${1}"
  local is_error=false
  
  workspace_file="$(_deno_json_file "$PARENT_DIR")"
  debug "Using workspace file: %s" "$workspace_file"

  cat "$(_deno_json_file "$PARENT_DIR")" | jq -r '.workspace[]' | while read -r package; do
    package_dir="$PARENT_DIR/$package"
    debug "Processing package directory: %s" "$package_dir"

    if [[ ! -d "$package_dir" ]]; then
      error "package directory %s does not exist" "$package_dir"
      exit 1
    fi

    deno_json_file="$(_deno_json_file "$package_dir")"

    if [[ -z "$deno_json_file" ]]; then
      error "no deno.json or deno.jsonc file found in %s" "$package_dir"
      exit 1
    fi

    debug "Found file: %s" "$deno_json_file"

    found_version="$(cat "$deno_json_file" | jq -r '.version')"
    if [[ "$found_version" != "$expected_version" ]]; then
      error "version mismatch in %s: expected %s, found %s" "$deno_json_file" "$expected_version" "$found_version"
      is_error=true
    fi
  done

  if [ "$is_error" = true ]; then
    error "Version verification failed."
    exit 1
  else
    debug "All versions match the expected version: %s" "$expected_version"
  fi
}

main "$@"
