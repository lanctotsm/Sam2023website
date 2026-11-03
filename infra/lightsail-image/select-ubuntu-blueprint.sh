#!/usr/bin/env bash
# Pick the Lightsail OS blueprint for the Heron runtime image.
#
# Lightsail stores the release in blueprint.version ("26.04 LTS"), not in
# name (which is "Ubuntu"). Prefer the newest active Ubuntu LTS at or above
# the minimum. If no LTS meets the minimum, use the newest active Ubuntu that
# does. Prints the blueprint id. The chosen version is written to stderr.
#
# Usage: select-ubuntu-blueprint.sh BLUEPRINTS_JSON [MIN_VERSION]
# MIN_VERSION defaults to 26.04. BLUEPRINTS_JSON is `get-blueprints` output.
set -euo pipefail

JSON_FILE=${1:?path to get-blueprints JSON}
MIN=${2:-26.04}

if [[ ! "$MIN" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
  echo "Minimum Ubuntu version must look like 26.04, got: ${MIN}" >&2
  exit 1
fi
MIN_MAJ=${BASH_REMATCH[1]}
MIN_MIN=${BASH_REMATCH[2]}

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to select a Lightsail blueprint" >&2
  exit 1
fi

list_ubuntu() {
  jq -r '
    def rows:
      if type == "array" then .
      elif type == "object" and (.blueprints | type == "array") then .blueprints
      else error("expected get-blueprints JSON")
      end;
    rows[]
    | select(.platform == "LINUX_UNIX" and .type == "os" and .isActive == true)
    | select(.name == "Ubuntu" or (.name | startswith("Ubuntu")))
    | "\(.blueprintId)\t\(.version)"
  ' "$JSON_FILE"
}

chosen=$(jq -er --argjson maj "$MIN_MAJ" --argjson min "$MIN_MIN" '
  def rows:
    if type == "array" then .
    elif type == "object" and (.blueprints | type == "array") then .blueprints
    else error("expected get-blueprints JSON")
    end;
  def parsed:
    rows[]
    | select(.platform == "LINUX_UNIX" and .type == "os" and .isActive == true)
    | select(.name == "Ubuntu" or (.name | startswith("Ubuntu")))
    | . as $bp
    | ($bp.version | capture("^(?<maj>[0-9]+)\\.(?<min>[0-9]+)")?) as $c
    | select($c != null)
    | {
        blueprintId: $bp.blueprintId,
        version: $bp.version,
        maj: ($c.maj | tonumber),
        min: ($c.min | tonumber),
        lts: ($bp.version | test("LTS"))
      };
  [parsed | select(.maj > $maj or (.maj == $maj and .min >= $min))] as $eligible
  | if ($eligible | length) == 0 then
      null
    else
      ($eligible | map(select(.lts))) as $lts
      | (if ($lts | length) > 0 then $lts else $eligible end)
      | sort_by(.maj, .min)
      | last
      | "\(.blueprintId)\t\(.version)"
    end
' "$JSON_FILE" 2>/dev/null || true)

if [ -z "$chosen" ] || [ "$chosen" = "null" ]; then
  echo "No active Ubuntu OS blueprint at or above ${MIN}." >&2
  echo "Active Ubuntu OS blueprints:" >&2
  list_ubuntu >&2 || true
  exit 1
fi

blueprint_id=${chosen%%$'\t'*}
version=${chosen#*$'\t'}
echo "Selected Ubuntu blueprint ${blueprint_id} (${version}), minimum ${MIN}" >&2
printf '%s\n' "$blueprint_id"
