#!/usr/bin/env bash

#
#
# Please, stop looking here.
#
# This bash script looks terrible.
#
# Stop looking at it, please.
#
# Go away!
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function reltrim {
  local base=$1 target=$2
  # require both
  [ -n "$base" ] || return 1
  [ -n "$target" ] || return 1

  # ensure no trailing slashes (but keep root "/")
  [[ $base != / ]] && base=${base%/}
  [[ $target != / ]] && target=${target%/}

  # if base equals prefix of target
  if [[ $target == "$base"/* ]]; then
    printf '%s\n' "${target#"$base"/}"
    return 0
  fi

  # if identical
  if [[ $target == "$base" ]]; then
    printf '.\n'
    return 0
  fi

  # no common prefix — return original target (or ./target if you prefer)
  printf '%s\n' "$target"
}

function debug {
  # shellcheck disable=SC2059
  if [ "${DEBUG:=\0}" = "\0" ]; then
    return
  fi
  >&2 printf "debug: $1\n" "${@:2}"
}

function error {
  # shellcheck disable=SC2059
  >&2 printf "\x1b[31merror: $1\n\x1b[0m" "${@:2}"
}

# if script dir does not end with /.git/user-scripts, exit
if [[ ! "$SCRIPT_DIR" =~ /.git/user-scripts$ ]]; then
  echo "You are not meant to run this script directly."
  exit 1
fi

PARENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

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
  relative_workspace_file="$(reltrim "$PARENT_DIR" "$workspace_file")"
  debug "Using workspace file: %s" "$relative_workspace_file"

  cat "$(_deno_json_file "$PARENT_DIR")" | jq -r '.workspace[]' | while read -r package; do
    package_dir="$PARENT_DIR/$package"
    relative_package_dir="$(reltrim "$PARENT_DIR" "$package_dir")"
    debug "Processing package directory: %s" "$relative_package_dir"

    if [[ ! -d "$package_dir" ]]; then
      error "package directory %s does not exist" "$relative_package_dir"
      exit 1
    fi

    deno_json_file="$(_deno_json_file "$package_dir")"

    if [[ -z "$deno_json_file" ]]; then
      error "no deno.json or deno.jsonc file found in %s" "$relative_package_dir"
      exit 1
    fi

    relative_deno_json_file="$(reltrim "$PARENT_DIR" "$deno_json_file")"

    debug "Found file: %s" "$relative_deno_json_file"

    found_version="$(cat "$deno_json_file" | jq -r '.version')"
    if [[ "$found_version" != "$expected_version" ]]; then
      error "version mismatch in %s: expected %s, found %s" "$relative_deno_json_file" "$expected_version" "$found_version"
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
