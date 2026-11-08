#!/usr/bin/env bash
#
# Bump the plugin version.
#
# Usage: bin/bump-version.sh <version>
#
# <version> is anything `npm version` accepts: an explicit version such as
# 1.2.0, or major, minor, patch, premajor, preminor, prepatch or prerelease.
#
# Sets the version in package.json and package-lock.json with `npm version`,
# then copies it to the plugin header, the PLUGIN_VERSION constant and the
# readme's stable tag. Nothing is committed or tagged.

set -euo pipefail

if [ $# -ne 1 ]; then
	echo "Usage: $0 <version|major|minor|patch|premajor|preminor|prepatch|prerelease>" >&2
	exit 1
fi

cd "$(dirname "$0")/.."

# Files containing the version, and a regex matching it in each. The regexes
# must be valid in both grep -E and Perl. The first capture group is kept and
# the rest of the match is replaced with the new version.
FILES=(
	code-bin-block.php
	inc/namespace.php
	readme.txt
)
PATTERNS=(
	'^( \* Version: +)[^[:space:]]+$'
	"^(const PLUGIN_VERSION = ')[^']+"
	'^(Stable tag: +)[^[:space:]]+$'
)

# Check every file before changing anything.
for i in "${!FILES[@]}"; do
	if ! grep -qE "${PATTERNS[$i]}" "${FILES[$i]}"; then
		echo "Could not find the version in ${FILES[$i]}" >&2
		exit 1
	fi
done

npm version "$1" --no-git-tag-version > /dev/null

VERSION="$(node -p "require('./package.json').version")"
export VERSION

for i in "${!FILES[@]}"; do
	PATTERN="${PATTERNS[$i]}" perl -pi -e 's/$ENV{PATTERN}/$1$ENV{VERSION}/' "${FILES[$i]}"
done

echo "Version bumped to $VERSION."
echo "Remember to add a changelog entry to readme.txt."
