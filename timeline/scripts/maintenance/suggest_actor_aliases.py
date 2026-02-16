#!/usr/bin/env python3
"""
Detect likely actor name duplicates and build actor_aliases.json interactively.

Multi-strategy duplicate detector that proposes alias groups, lets the user
accept/reject/edit interactively, and outputs actor_aliases.json.

Usage:
    python scripts/maintenance/suggest_actor_aliases.py              # interactive
    python scripts/maintenance/suggest_actor_aliases.py --auto=90    # auto-accept >=90% confidence
    python scripts/maintenance/suggest_actor_aliases.py --dry-run    # show proposals only
    python scripts/maintenance/suggest_actor_aliases.py --incremental # extend existing file
"""

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

import yaml

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent.parent / "data"
EVENTS_DIR = DATA_DIR / "events"
ALIASES_FILE = DATA_DIR / "actor_aliases.json"

# ── Known acronym table ──────────────────────────────────────────────────────

KNOWN_ACRONYMS = {
    "FBI": "Federal Bureau of Investigation",
    "CIA": "Central Intelligence Agency",
    "NSA": "National Security Agency",
    "DOJ": "Department of Justice",
    "DOD": "Department of Defense",
    "DHS": "Department of Homeland Security",
    "EPA": "Environmental Protection Agency",
    "SEC": "Securities and Exchange Commission",
    "FCC": "Federal Communications Commission",
    "FTC": "Federal Trade Commission",
    "FDA": "Food and Drug Administration",
    "IRS": "Internal Revenue Service",
    "ICE": "Immigration and Customs Enforcement",
    "CBP": "Customs and Border Protection",
    "ATF": "Bureau of Alcohol, Tobacco, Firearms and Explosives",
    "DEA": "Drug Enforcement Administration",
    "FEMA": "Federal Emergency Management Agency",
    "NASA": "National Aeronautics and Space Administration",
    "USPS": "United States Postal Service",
    "GAO": "Government Accountability Office",
    "CBO": "Congressional Budget Office",
    "OMB": "Office of Management and Budget",
    "OPM": "Office of Personnel Management",
    "GSA": "General Services Administration",
    "CFPB": "Consumer Financial Protection Bureau",
    "NLRB": "National Labor Relations Board",
    "OSHA": "Occupational Safety and Health Administration",
    "HHS": "Department of Health and Human Services",
    "HUD": "Department of Housing and Urban Development",
    "USDA": "United States Department of Agriculture",
    "DOE": "Department of Energy",
    "DOI": "Department of the Interior",
    "DOT": "Department of Transportation",
    "VA": "Department of Veterans Affairs",
    "DOGE": "Department of Government Efficiency",
    "USAID": "United States Agency for International Development",
    "NATO": "North Atlantic Treaty Organization",
    "UN": "United Nations",
    "WHO": "World Health Organization",
    "IMF": "International Monetary Fund",
    "SCOTUS": "Supreme Court of the United States",
    "ACLU": "American Civil Liberties Union",
    "NRA": "National Rifle Association",
    "GOP": "Republican Party",
    "DNC": "Democratic National Committee",
    "RNC": "Republican National Committee",
    "PAC": "Political Action Committee",
    "NAACP": "National Association for the Advancement of Colored People",
}


# ── Actor extraction ─────────────────────────────────────────────────────────

def extract_actors_from_events():
    """Parse all markdown event files and return actor -> count mapping."""
    actor_counts = Counter()

    for filepath in EVENTS_DIR.glob("*.md"):
        if filepath.name == "_index.md":
            continue

        try:
            content = filepath.read_text()
        except Exception:
            continue

        if not content.startswith("---"):
            continue

        parts = content.split("---", 2)
        if len(parts) < 3:
            continue

        try:
            frontmatter = yaml.safe_load(parts[1])
        except yaml.YAMLError:
            continue

        if not frontmatter or not frontmatter.get("actors"):
            continue

        for actor in frontmatter["actors"]:
            if actor and isinstance(actor, str):
                actor_counts[actor] += 1

    return actor_counts


# ── Normalization helpers ────────────────────────────────────────────────────

def slugify(text):
    """Convert text to a slug for comparison."""
    text = unicodedata.normalize("NFKD", text)
    text = text.lower().strip()
    text = re.sub(r"[''`]s\b", "s", text)  # possessives
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def strip_prefix(name):
    """Remove U.S./US/United States prefix."""
    for prefix in ["U.S. ", "US ", "United States "]:
        if name.startswith(prefix):
            return name[len(prefix):]
    return None


def strip_parenthetical(name):
    """Remove parenthetical from name, return (base, acronym_or_none)."""
    m = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", name)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return None, None


# ── Proposal data structure ──────────────────────────────────────────────────

class Proposal:
    __slots__ = ("canonical", "aliases", "strategy", "confidence", "counts")

    def __init__(self, canonical, aliases, strategy, confidence, counts):
        self.canonical = canonical
        self.aliases = list(aliases)
        self.strategy = strategy
        self.confidence = confidence
        self.counts = counts  # dict: name -> count

    @property
    def total_uses(self):
        return sum(self.counts.get(n, 0) for n in [self.canonical] + self.aliases)

    def __repr__(self):
        return f"Proposal({self.canonical!r}, aliases={self.aliases}, {self.strategy}, {self.confidence}%)"


# ── Canonical name selection ─────────────────────────────────────────────────

def pick_canonical(names, counts):
    """
    Choose the canonical name from a set of candidates.

    Priority:
    1. Full official name over acronym
    2. Without U.S./US prefix over with (unless 80%+ usage has prefix)
    3. Proper case over lowercase
    4. Without parenthetical over with
    5. Highest count breaks ties
    """
    def score(name):
        is_acronym = name.isupper() and len(name) <= 8
        has_prefix = any(name.startswith(p) for p in ["U.S. ", "US ", "United States "])
        has_paren = "(" in name
        is_proper = name[0].isupper() if name else False

        # Check if prefix variant dominates usage
        prefix_dominant = False
        if has_prefix:
            total = sum(counts.get(n, 0) for n in names)
            if total > 0 and counts.get(name, 0) / total >= 0.8:
                prefix_dominant = True

        return (
            0 if is_acronym else 1,            # prefer full name
            1 if (has_prefix and not prefix_dominant) else 0,  # prefer no prefix (unless dominant)
            1 if is_proper else 0,              # prefer proper case
            0 if has_paren else 1,              # prefer no parenthetical
            counts.get(name, 0),                # highest count breaks ties
        )

    return max(names, key=score)


# ── Detection strategies ─────────────────────────────────────────────────────

def find_slug_duplicates(actors, counts):
    """Pass 1: Group actors with identical slugs."""
    slug_groups = defaultdict(list)
    for actor in actors:
        slug_groups[slugify(actor)].append(actor)

    proposals = []
    matched = set()
    for slug, group in slug_groups.items():
        if len(group) < 2:
            continue
        canonical = pick_canonical(group, counts)
        aliases = [a for a in group if a != canonical]
        proposals.append(Proposal(canonical, aliases, "slug-match", 95, counts))
        matched.update(group)

    return proposals, matched


def find_case_duplicates(actors, counts):
    """Pass 2: Exact case-insensitive matches."""
    lower_groups = defaultdict(list)
    for actor in actors:
        lower_groups[actor.lower()].append(actor)

    proposals = []
    matched = set()
    for key, group in lower_groups.items():
        if len(group) < 2:
            continue
        canonical = pick_canonical(group, counts)
        aliases = [a for a in group if a != canonical]
        proposals.append(Proposal(canonical, aliases, "exact-case", 100, counts))
        matched.update(group)

    return proposals, matched


def find_prefix_duplicates(actors, counts):
    """Pass 3: U.S./US prefix stripping."""
    actor_set = set(actors)
    proposals = []
    matched = set()

    for actor in actors:
        stripped = strip_prefix(actor)
        if stripped and stripped in actor_set and stripped not in matched and actor not in matched:
            group = [actor, stripped]
            canonical = pick_canonical(group, counts)
            aliases = [a for a in group if a != canonical]
            proposals.append(Proposal(canonical, aliases, "prefix-strip", 90, counts))
            matched.update(group)

    return proposals, matched


def find_parenthetical_duplicates(actors, counts):
    """Pass 4: Parenthetical removal (+ acronym matching)."""
    actor_set = set(actors)
    proposals = []
    matched = set()

    for actor in actors:
        base, acronym = strip_parenthetical(actor)
        if base is None:
            continue

        group = {actor}
        if base in actor_set:
            group.add(base)
        if acronym and acronym in actor_set:
            group.add(acronym)

        if len(group) < 2:
            continue

        # Skip if any already matched
        if group & matched:
            continue

        canonical = pick_canonical(list(group), counts)
        aliases = [a for a in group if a != canonical]
        proposals.append(Proposal(canonical, sorted(aliases), "parenthetical", 90, counts))
        matched.update(group)

    return proposals, matched


def find_acronym_duplicates(actors, counts):
    """Pass 5: Known acronym table matching."""
    actor_set = set(actors)
    proposals = []
    matched = set()

    # Also build reverse lookup
    full_to_acronym = {v: k for k, v in KNOWN_ACRONYMS.items()}

    for actor in actors:
        if actor in matched:
            continue

        group = {actor}

        # If actor is an acronym, look for the full name
        if actor in KNOWN_ACRONYMS:
            full = KNOWN_ACRONYMS[actor]
            if full in actor_set:
                group.add(full)
            # Also check with U.S. prefix
            for prefix in ["U.S. ", "US "]:
                prefixed = prefix + full
                if prefixed in actor_set:
                    group.add(prefixed)

        # If actor is a full name, look for its acronym
        if actor in full_to_acronym:
            acr = full_to_acronym[actor]
            if acr in actor_set:
                group.add(acr)

        if len(group) < 2 or group & matched:
            continue

        canonical = pick_canonical(list(group), counts)
        aliases = [a for a in group if a != canonical]
        proposals.append(Proposal(canonical, sorted(aliases), "known-acronym", 85, counts))
        matched.update(group)

    return proposals, matched


def find_fuzzy_duplicates(actors, counts, threshold=0.85, min_count=2):
    """Pass 6: Fuzzy matching using difflib, grouped by first word to avoid O(n^2)."""
    # Filter to actors with count >= min_count
    candidates = [a for a in actors if counts.get(a, 0) >= min_count]

    # Group by first word
    first_word_groups = defaultdict(list)
    for actor in candidates:
        first = actor.split()[0].lower() if actor.split() else ""
        first_word_groups[first].append(actor)

    proposals = []
    matched = set()

    for first_word, group in first_word_groups.items():
        if len(group) < 2:
            continue

        # Compare all pairs within group
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                if a in matched or b in matched:
                    continue

                ratio = SequenceMatcher(None, a.lower(), b.lower()).ratio()
                if ratio >= threshold:
                    pair = [a, b]
                    canonical = pick_canonical(pair, counts)
                    aliases = [x for x in pair if x != canonical]
                    confidence = int(ratio * 100)
                    proposals.append(Proposal(canonical, aliases, "fuzzy", confidence, counts))
                    matched.update(pair)

    return proposals, matched


# ── Main pipeline ────────────────────────────────────────────────────────────

def run_detection(actor_counts):
    """Run all detection strategies in order, each pass removes matched actors."""
    remaining = set(actor_counts.keys())
    all_proposals = []

    strategies = [
        ("Case-insensitive exact", find_case_duplicates),
        ("Slug match", find_slug_duplicates),
        ("Prefix stripping (U.S./US)", find_prefix_duplicates),
        ("Parenthetical removal", find_parenthetical_duplicates),
        ("Known acronym table", find_acronym_duplicates),
        ("Fuzzy matching", find_fuzzy_duplicates),
    ]

    for name, fn in strategies:
        proposals, matched = fn(list(remaining), actor_counts)
        all_proposals.extend(proposals)
        remaining -= matched
        if proposals:
            print(f"  {name}: {len(proposals)} proposals")

    # Sort: highest confidence first, then by total uses
    all_proposals.sort(key=lambda p: (-p.confidence, -p.total_uses))

    return all_proposals


# ── Conflict detection ───────────────────────────────────────────────────────

def check_conflicts(accepted, new_proposal):
    """
    Ensure no actor appears in multiple groups.
    Returns conflicting proposal or None.
    """
    new_names = {new_proposal.canonical} | set(new_proposal.aliases)

    for existing in accepted:
        existing_names = {existing.canonical} | set(existing.aliases)
        overlap = new_names & existing_names
        if overlap:
            return existing, overlap

    return None, None


# ── Interactive review ───────────────────────────────────────────────────────

def format_proposal(idx, total, proposal):
    """Format a proposal for display."""
    lines = []
    lines.append(f"\nProposal {idx}/{total} [{proposal.strategy}, confidence: {proposal.confidence}%]")
    lines.append(f"  Canonical: \"{proposal.canonical}\" ({proposal.counts.get(proposal.canonical, 0)} uses)")
    lines.append("  Aliases:")
    for i, alias in enumerate(proposal.aliases, 1):
        lines.append(f"    {i}. \"{alias}\" ({proposal.counts.get(alias, 0)} uses)")
    lines.append(f"  Impact: {proposal.total_uses} uses → 1 name")
    return "\n".join(lines)


def edit_proposal(proposal):
    """Interactive edit of a proposal."""
    print("\n  Edit mode:")
    print(f"  Current canonical: \"{proposal.canonical}\"")

    new_canonical = input("  New canonical (Enter to keep): ").strip()
    if new_canonical and new_canonical != proposal.canonical:
        # Move old canonical to aliases if not already there
        if proposal.canonical not in proposal.aliases:
            proposal.aliases.append(proposal.canonical)
        proposal.canonical = new_canonical
        # Remove from aliases if it was there
        if new_canonical in proposal.aliases:
            proposal.aliases.remove(new_canonical)

    print(f"  Current aliases: {proposal.aliases}")
    remove = input("  Aliases to remove (comma-separated numbers, or Enter): ").strip()
    if remove:
        try:
            indices = [int(x.strip()) - 1 for x in remove.split(",")]
            proposal.aliases = [a for i, a in enumerate(proposal.aliases) if i not in indices]
        except ValueError:
            print("  Invalid input, keeping aliases unchanged")

    add = input("  Aliases to add (comma-separated, or Enter): ").strip()
    if add:
        for alias in add.split(","):
            alias = alias.strip()
            if alias and alias != proposal.canonical and alias not in proposal.aliases:
                proposal.aliases.append(alias)

    return proposal


def interactive_review(proposals, existing_aliases=None):
    """Interactive review of proposals. Returns accepted proposals."""
    accepted = []
    # Track existing canonical names and aliases to prevent conflicts
    existing_names = set()
    if existing_aliases:
        for canonical, aliases in existing_aliases.items():
            existing_names.add(canonical)
            existing_names.update(aliases)

    total = len(proposals)
    auto_accept_threshold = None
    auto_reject_threshold = None
    i = 0

    try:
        while i < total:
            proposal = proposals[i]

            # Check auto thresholds
            if auto_accept_threshold is not None and proposal.confidence >= auto_accept_threshold:
                conflict, overlap = check_conflicts(accepted, proposal)
                if conflict is None:
                    accepted.append(proposal)
                    print(f"  Auto-accepted: \"{proposal.canonical}\" ({len(proposal.aliases)} aliases) [{proposal.strategy}]")
                    i += 1
                    continue

            if auto_reject_threshold is not None and proposal.confidence < auto_reject_threshold:
                print(f"  Auto-rejected: \"{proposal.canonical}\" (confidence {proposal.confidence}% < {auto_reject_threshold}%)")
                i += 1
                continue

            print(format_proposal(i + 1, total, proposal))

            # Check for conflicts
            conflict, overlap = check_conflicts(accepted, proposal)
            if conflict:
                print(f"  ⚠ Conflicts with accepted: \"{conflict.canonical}\" (overlap: {overlap})")

            prompt = "\n[A]ccept [R]eject [E]dit [S]kip [Q]uit | Auto: [AA] accept all >=N%  [AR] reject all <N%: "
            choice = input(prompt).strip().upper()

            if choice == "A":
                if conflict:
                    print("  Cannot accept — conflicts with existing group. Edit or skip.")
                    continue
                accepted.append(proposal)
                i += 1
            elif choice == "R":
                i += 1
            elif choice == "E":
                proposal = edit_proposal(proposal)
                # Re-display and re-prompt (don't advance)
                continue
            elif choice == "S":
                i += 1
            elif choice == "Q":
                break
            elif choice.startswith("AA"):
                try:
                    threshold = int(choice[2:].strip() or "90")
                    auto_accept_threshold = threshold
                    print(f"\n  Auto-accepting all proposals with confidence >= {threshold}%")
                except ValueError:
                    print("  Invalid threshold")
            elif choice.startswith("AR"):
                try:
                    threshold = int(choice[2:].strip() or "70")
                    auto_reject_threshold = threshold
                    print(f"\n  Auto-rejecting all proposals with confidence < {threshold}%")
                except ValueError:
                    print("  Invalid threshold")
            else:
                print("  Unknown command. Try A, R, E, S, Q, AA90, AR70")

    except KeyboardInterrupt:
        print(f"\n\nInterrupted! Saving {len(accepted)} accepted proposals...")

    return accepted


# ── Output ───────────────────────────────────────────────────────────────────

def build_aliases_dict(accepted_proposals, existing_aliases=None):
    """Build the canonical -> [aliases] dictionary."""
    result = dict(existing_aliases) if existing_aliases else {}

    for proposal in accepted_proposals:
        if proposal.canonical in result:
            # Merge aliases
            existing = set(result[proposal.canonical])
            existing.update(proposal.aliases)
            result[proposal.canonical] = sorted(existing)
        else:
            result[proposal.canonical] = sorted(proposal.aliases)

    # Sort by canonical name
    return dict(sorted(result.items()))


def save_aliases(aliases_dict, path):
    """Write actor_aliases.json."""
    with open(path, "w") as f:
        json.dump(aliases_dict, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nSaved {len(aliases_dict)} canonical entries to {path}")


# ── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Detect actor name duplicates and build actor_aliases.json"
    )
    parser.add_argument(
        "--auto", type=int, metavar="N",
        help="Auto-accept proposals with confidence >= N%% (e.g. --auto=90)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show proposals without interactive review or saving"
    )
    parser.add_argument(
        "--incremental", action="store_true",
        help="Extend existing actor_aliases.json instead of replacing"
    )
    parser.add_argument(
        "--min-confidence", type=int, default=0,
        help="Only show proposals with confidence >= N%%"
    )
    args = parser.parse_args()

    # Load existing aliases if incremental
    existing_aliases = None
    if args.incremental and ALIASES_FILE.exists():
        with open(ALIASES_FILE) as f:
            existing_aliases = json.load(f)
        print(f"Loaded {len(existing_aliases)} existing alias groups from {ALIASES_FILE}")

    # Extract actors
    print("Scanning events for actor names...")
    actor_counts = extract_actors_from_events()
    print(f"Found {len(actor_counts)} unique actors across {sum(actor_counts.values())} total uses\n")

    # Remove actors already mapped in existing aliases
    if existing_aliases:
        already_mapped = set()
        for canonical, aliases in existing_aliases.items():
            already_mapped.update(aliases)
        before = len(actor_counts)
        actor_counts = Counter({k: v for k, v in actor_counts.items() if k not in already_mapped})
        print(f"Excluded {before - len(actor_counts)} already-mapped actors\n")

    # Run detection
    print("Running detection strategies...")
    proposals = run_detection(actor_counts)

    # Filter by min confidence
    if args.min_confidence:
        proposals = [p for p in proposals if p.confidence >= args.min_confidence]

    print(f"\nTotal proposals: {len(proposals)}")

    if not proposals:
        print("No duplicates detected!")
        return

    # Dry run: just show proposals
    if args.dry_run:
        print("\n=== DRY RUN — Proposals ===")
        for i, p in enumerate(proposals, 1):
            print(format_proposal(i, len(proposals), p))
        print(f"\nTotal: {len(proposals)} proposals")
        return

    # Auto mode
    if args.auto is not None:
        print(f"\nAuto-accepting proposals with confidence >= {args.auto}%...")
        accepted = []
        for p in proposals:
            if p.confidence >= args.auto:
                conflict, _ = check_conflicts(accepted, p)
                if conflict is None:
                    accepted.append(p)
        print(f"Accepted {len(accepted)} proposals (skipped {len(proposals) - len(accepted)})")
    else:
        # Interactive review
        print("\nStarting interactive review...")
        print("Commands: [A]ccept [R]eject [E]dit [S]kip [Q]uit")
        print("Auto: [AA90] accept all >=90%  [AR70] reject all <70%\n")
        accepted = interactive_review(proposals, existing_aliases)

    if not accepted:
        print("No proposals accepted.")
        return

    # Build and save
    aliases_dict = build_aliases_dict(accepted, existing_aliases)

    total_aliases = sum(len(v) for v in aliases_dict.values())
    print(f"\nResult: {len(aliases_dict)} canonical names, {total_aliases} aliases")

    save_aliases(aliases_dict, ALIASES_FILE)


if __name__ == "__main__":
    main()
