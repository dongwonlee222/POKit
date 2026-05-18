#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"

command="$(
  PAYLOAD="$payload" node -e '
    try {
      const payload = JSON.parse(process.env.PAYLOAD || "{}");
      process.stdout.write(String(payload.tool_input?.command || ""));
    } catch {
      process.stdout.write("");
    }
  '
)"

if [[ -z "$command" ]]; then
  exit 0
fi

if [[ "$command" == *"--allow-raw-linear"* ]]; then
  exit 0
fi

if [[ "$command" == *"api.linear.app"* ]]; then
  echo "Linear HTTP 직접 호출 차단. node scripts/internal/linear.ts (linear-issue-manager 스킬) 경유 필수. (POKIT-167/177/187)" >&2
  exit 2
fi

exit 0
