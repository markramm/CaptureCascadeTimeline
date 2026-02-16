#!/bin/bash
# Convenience script for normalizing all timeline events before committing
# Run this script to fix actor, tag, and outlet normalization issues
#
# Usage:
#   ./scripts/normalize_all.sh         # Dry run - show what would change
#   ./scripts/normalize_all.sh --apply # Apply all normalizations
#
# This is recommended to run BEFORE committing to avoid pre-commit hook failures

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=============================================="
echo "   Timeline Event Normalization Script"
echo "=============================================="
echo ""

# Check if --apply flag is provided
APPLY_FLAG=""
if [ "$1" = "--apply" ]; then
    APPLY_FLAG="--apply"
    echo "🔧 APPLY MODE: Changes will be written to files"
else
    echo "🔍 DRY RUN MODE: No changes will be made"
    echo "   Run with --apply to make changes"
fi
echo ""

# Track if any changes needed
CHANGES_NEEDED=0

# 1. Normalize actors
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/3: Normalizing actor names..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "scripts/normalize_actors.py" ]; then
    OUTPUT=$(python3 scripts/normalize_actors.py $APPLY_FLAG 2>&1) || true
    echo "$OUTPUT"
    if echo "$OUTPUT" | grep -q "Would apply\|Applied"; then
        CHANGES_NEEDED=1
    fi
else
    echo "⚠️  normalize_actors.py not found, skipping..."
fi
echo ""

# 2. Normalize tags
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/3: Normalizing tags..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "scripts/normalize_tags.py" ]; then
    OUTPUT=$(python3 scripts/normalize_tags.py $APPLY_FLAG 2>&1) || true
    echo "$OUTPUT"
    if echo "$OUTPUT" | grep -q "Would apply\|Applied"; then
        CHANGES_NEEDED=1
    fi
else
    echo "⚠️  normalize_tags.py not found, skipping..."
fi
echo ""

# 3. Normalize outlets/sources
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/3: Normalizing outlet names..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "scripts/normalize_outlets.py" ]; then
    OUTPUT=$(python3 scripts/normalize_outlets.py $APPLY_FLAG 2>&1) || true
    echo "$OUTPUT"
    if echo "$OUTPUT" | grep -q "Would apply\|Applied"; then
        CHANGES_NEEDED=1
    fi
else
    echo "⚠️  normalize_outlets.py not found, skipping..."
fi
echo ""

# Summary
echo "=============================================="
echo "                  Summary"
echo "=============================================="

if [ "$APPLY_FLAG" = "--apply" ]; then
    echo "✅ Normalization complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Stage changes:  git add timeline/data/events/"
    echo "  3. Commit:         git commit"
else
    if [ $CHANGES_NEEDED -eq 1 ]; then
        echo "⚠️  Normalization issues found!"
        echo ""
        echo "To fix, run:"
        echo "  ./scripts/normalize_all.sh --apply"
    else
        echo "✅ No normalization issues found!"
    fi
fi
echo ""
