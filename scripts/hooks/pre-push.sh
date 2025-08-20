#!/usr/bin/env bash

set -euo pipefail

IS_DEBUGGING=true

if [[ -z "${DEBUG:-}" ]]; then
  IS_DEBUGGING=false
fi

function keep_if_not_debug {
  if [[ -z "${DEBUG:-}" ]]; then
    echo -n "$1"
  fi
}

function debug {
  if [[ -z "${DEBUG:-}" ]]; then
    return
  fi
  # shellcheck disable=SC2059
  >&2 printf "debug: $1\n" "${@:2}"
}

function error {
  # shellcheck disable=SC2059
  >&2 printf "\x1b[31merror: $1\n\x1b[0m" "${@:2}"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT_DIR="$(dirname "$GIT_DIR")"
SCRIPTS_DIR="$REPO_ROOT_DIR/scripts"
DEP_DIR="$GIT_DIR/user-scripts"

dependencies=(
  "$SCRIPTS_DIR/verify-versions.sh:$DEP_DIR/verify-versions"
)

for dep in "${dependencies[@]}"; do
  src="${dep%%:*}"
  dest="${dep#*:}"
  
  if [[ ! -f "$src" ]]; then
    error "source file $src does not exist."
    exit 1
  fi
  
  if [[ ! -d "$DEP_DIR" ]]; then
    mkdir -p "$DEP_DIR"
  fi
  
  if [[ -f "$dest" ]]; then
    debug "warning: destination file $dest already exists, overwriting."
    rm "$dest"
  fi
  cp "$src" "$dest"
  chmod +x "$dest"
  debug "Copied $src to $dest"
done

remote="$1"
url="$2"

# shellcheck disable=SC2021
zero=$(git hash-object --stdin </dev/null | tr '[0-9a-f]' '0')

debug "remote: %s" "$remote"
debug "url: %s" "$url"
debug "zero: %s" "$zero"

shaAndExpectedVersion=()

while read local_ref local_oid remote_ref remote_oid; do
  debug "local_ref: %s" "$local_ref"
  debug "local_oid: %s" "$local_oid"
  debug "remote_ref: %s" "$remote_ref"
  debug "remote_oid: %s" "$remote_oid"

  if [ "$local_oid" = "$zero" ]; then
    debug "Skipping %s as it is empty." "$local_ref"
    continue
  fi

  case "$local_ref" in
    refs/tags/*)
      sha="$local_oid"
      version="${local_ref#refs/tags/}"
      debug "Processing sha %s and version %s" "$sha" "$version"
      if [[ "$sha" == "$zero" ]]; then
        debug "Skipping zero sha %s" "$sha"
        continue
      fi
      for i in "${!shaAndExpectedVersion[@]}"; do
        if [[ "${shaAndExpectedVersion[i]}" == "$sha:"* ]]; then
          error "Version %s already exists for sha %s when processing %s: cannot push two different version tags with the same sha. Did you even update the deno.json files?" "${shaAndExpectedVersion[i]#*:}" "$sha" "$local_ref"
          exit 1
        fi
      done
      shaAndExpectedVersion+=("$sha:$version")
      debug "Added new sha %s with version %s" "$sha" "$version"
      ;;
    *)
      debug "Ignoring %s" "$local_ref"
      continue
      ;;
  esac
done

debug "shaAndExpectedVersion: %s" "${shaAndExpectedVersion[*]}"

if [[ ${#shaAndExpectedVersion[@]} -eq 0 ]]; then
  debug "No tags to process."
  exit 0
fi

# ensure we have a reference that we can restore to
current_ref="$(git symbolic-ref -q HEAD)"
if [[ -z "$current_ref" ]]; then
  current_ref="$(git rev-parse --short HEAD)"
  if [[ -z "$current_ref" ]]; then
    error "No current branch or commit found."
    exit 1
  fi
fi
debug "Currently checked out ref: %s" "$current_ref"

# stash any changes to ensure we can restore the repository state
debug "Stashing any changes before processing tags..."
if [[ "$IS_DEBUGGING" == true ]]; then
  git status --porcelain
fi
has_changes="$(git status --porcelain)"
stashed=false
stash_ref=""

GIT_QUIET_FLAG="$(keep_if_not_debug "--quiet")"

if [ -n "$has_changes" ]; then
  msg="script-temp-stash-$(date +%s)"
  # shellcheck disable=SC2086
  if ! git stash push $GIT_QUIET_FLAG -u -m "$msg"; then
    error "Failed to stash changes. Please resolve any conflicts and try again."
    exit 1
  fi
  stash_ref="$(git rev-parse --verify refs/stash 2>/dev/null || true)"
  stashed=true
fi

# shellcheck disable=SC2329
function restore_state {
  debug "Restoring state..."
  
  if [[ "$current_ref" == refs/heads/* ]]; then
    current_ref="${current_ref#refs/heads/}"
  fi

  debug "Checking out original ref: %s" "$current_ref"
  if ! git checkout "$current_ref"; then
    error "Failed to restore: could not checkout %s" "$current_ref"
    return 1
  else
    debug "Successfully restored to %s" "$current_ref"
  fi

  if [ "$stashed" = true ]; then
    debug "Restoring stash: %s" "$stash_ref"
    if ! git stash pop --index; then
      error "Failed to restore: could not pop stash, stash preserved:  %s" "$stash_ref"
      return 1
    fi
    debug "Successfully restored stash: %s" "$stash_ref"
  else
    debug "No stash to restore."
  fi
}

trap restore_state EXIT

function run_verify_versions {
  local -r sha="$1"
  local -r expected_version="$2"
  debug "Verifying version %s for sha %s" "$expected_version" "$sha"
  if ! git checkout "$sha" --quiet; then
    error "Failed to checkout sha %s for verification." "$sha"
    return 1
  fi
  if ! "$DEP_DIR/verify-versions.sh" "$expected_version"; then
    error "not pushing: version verification failed for sha %s with expected version %s." "$sha" "$expected_version"
    return 1
  fi
  debug "Version verification succeeded for sha %s with expected version %s." "$sha" "$expected_version"
}

for entry in "${shaAndExpectedVersion[@]}"; do
  sha="${entry%%:*}"
  expected_version="${entry#*:}"
  debug "Processing sha %s with expected version %s" "$sha" "$expected_version"
  
  if ! run_verify_versions "$sha" "$expected_version"; then
    exit 1
  fi
done

exit 2
