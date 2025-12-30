# Event Validation Plan

## Overview

**Objective**: Validate all 3,619 timeline events for factual accuracy, source integrity, well-formed structure, and completeness. Update events that need correction. Remove events that cannot be validated.

**Scale**: 3,619 markdown event files spanning 1142-2025

## Event Distribution by Era

| Era | Years | Event Count | Priority |
|-----|-------|-------------|----------|
| Pre-1970 | 1142-1969 | ~100 | Low (historical, stable) |
| 1970s-1990s | 1970-1999 | ~350 | Medium |
| 2000s-2010s | 2000-2019 | ~900 | Medium |
| 2020-2024 | 2020-2024 | ~600 | High (recent claims) |
| 2025 | 2025 | 1,262 | Critical (current events) |

---

## Validation Criteria

### 1. Structural Validation (Automated)
- Valid YAML frontmatter
- Required fields present (id, date, title)
- ID matches filename
- Date format YYYY-MM-DD
- Importance score 1-10
- Summary exists (min 50 chars)
- Sources array exists with at least 1 source
- Each source has: title, url, outlet, tier

### 2. Source Verification (Agent-Assisted)
- **URL accessibility**: Source URLs return 200 or redirect properly
- **Source tier accuracy**: Tier 1/2/3 correctly assigned
- **URL-content match**: Article title roughly matches source title
- **Outlet accuracy**: Named outlet matches URL domain
- **Date verification**: Event date aligns with source dates

### 3. Factual Accuracy (Agent-Assisted)
- Claims in summary supported by sources
- Actor names correct and properly formatted
- Dates accurate (cross-reference multiple sources)
- No factual contradictions between summary and sources
- Importance score appropriate for event significance

### 4. Completeness Check
- Summary provides adequate context (2+ paragraphs preferred)
- Relevant actors listed
- Appropriate tags assigned
- Capture lanes assigned where applicable

---

## Validation Actions

| Finding | Action |
|---------|--------|
| URL 404/inaccessible | Find replacement source or flag for removal |
| Minor factual error | Edit to correct |
| Major factual error | Flag for review, potentially remove |
| Missing required fields | Add if discoverable, else flag |
| Duplicate event | Mark for removal |
| Unsupportable claims | Remove unsupported claims or flag event |
| Source tier incorrect | Update tier |
| Malformed structure | Fix structure |

---

## Agent Architecture

### Batch Organization

Divide 3,619 events into manageable batches by year:

| Batch | Date Range | Est. Events | Agents |
|-------|------------|-------------|--------|
| A | 1142-1969 | ~100 | 1 |
| B | 1970-1989 | ~200 | 1 |
| C | 1990-1999 | ~150 | 1 |
| D | 2000-2009 | ~350 | 2 |
| E | 2010-2015 | ~350 | 2 |
| F | 2016-2019 | ~550 | 3 |
| G | 2020-2022 | ~350 | 2 |
| H | 2023-2024 | ~265 | 2 |
| I | 2025 Jan-Mar | ~300 | 2 |
| J | 2025 Apr-Jun | ~300 | 2 |
| K | 2025 Jul-Sep | ~300 | 2 |
| L | 2025 Oct-Dec | ~362 | 2 |

**Total: ~22 agent runs**

### Agent Task Description Template

```
VALIDATION AGENT: Batch [X] - [Date Range]

OBJECTIVE: Validate [N] events from [start] to [end]

FOR EACH EVENT:
1. Read the event file
2. Structural check:
   - Valid YAML?
   - Required fields present?
   - ID matches filename?
   - Date format correct?
   - Importance 1-10?
   - Summary exists (50+ chars)?
   - Sources array with required fields?

3. Source verification (for each source):
   - Test URL accessibility (WebFetch with simple prompt)
   - Verify outlet matches URL domain
   - Check tier assignment accuracy
   - Note any 404s or access issues

4. Factual spot-check:
   - Do summary claims match source content?
   - Are dates accurate?
   - Any obvious factual errors?

5. Classification:
   - VALID: No issues found
   - NEEDS_EDIT: Minor fixable issues (fix them)
   - NEEDS_REVIEW: Major issues requiring human review
   - REMOVE: Cannot be validated, recommend removal

OUTPUT FORMAT:
For each event, report:
- Filename
- Status: VALID | EDITED | FLAGGED | REMOVE
- Issues found (if any)
- Edits made (if any)

FINAL SUMMARY:
- Events validated: X
- Events edited: Y
- Events flagged for review: Z
- Events recommended for removal: W
- URLs inaccessible: N
```

---

## Implementation Phases

### Phase 1: Automated Structural Validation
**Method**: Python script
**Output**: List of structurally invalid events
**Time**: Minutes

Run existing validation script to catch obvious structural issues:
```bash
python3 timeline/scripts/validate_events.py > validation_results.txt
```

### Phase 2: Source URL Accessibility Check
**Method**: Python script with HTTP requests
**Output**: List of broken/inaccessible URLs
**Time**: Hours (rate-limited)

Create script to:
1. Extract all source URLs from all events
2. Test each URL for accessibility
3. Report 404s, timeouts, and redirects
4. Group by event for remediation

### Phase 3: Agent-Based Deep Validation
**Method**: Subagent batches (described above)
**Output**: Validated events, edits made, removal recommendations
**Time**: Several hours across multiple agent runs

### Phase 4: Human Review Queue
**Method**: Manual review of flagged events
**Output**: Final decisions on flagged events
**Time**: Variable based on queue size

### Phase 5: Cleanup and Commit
**Method**: Remove invalid events, commit changes
**Output**: Clean, validated timeline

---

## Subagent Prompt Template

```markdown
# Event Validation Agent - Batch [X]

You are validating timeline events for factual accuracy and structural integrity.

## Your Batch
- Date range: [START_DATE] to [END_DATE]
- Expected event count: ~[N]
- Directory: /Users/markr/kleptocracy-timeline/timeline/data/events/

## Validation Steps

For each event file in your batch:

### Step 1: Read the event
```
Read file: timeline/data/events/[filename].md
```

### Step 2: Structural validation
Check:
- [ ] Valid YAML frontmatter (--- delimiters)
- [ ] id field matches filename (without .md)
- [ ] date is YYYY-MM-DD format
- [ ] title is present and descriptive
- [ ] importance is 1-10
- [ ] actors is a list
- [ ] tags is a list (lowercase, hyphenated)
- [ ] sources is a list with at least 1 entry
- [ ] Each source has: title, url, outlet, tier
- [ ] Summary text exists (after --- closing)

### Step 3: Source verification
For each source URL:
- Use WebFetch to test accessibility (prompt: "confirm this page loads")
- If 404 or error: Flag for replacement
- Verify outlet name matches URL domain
- Check tier accuracy:
  - Tier 1: .gov, AP, Reuters, NPR, PBS, major networks, SCOTUSblog
  - Tier 2: Bloomberg, CNBC, Axios, specialty outlets
  - Tier 3: Blogs, advocacy sites, less reliable sources

### Step 4: Factual spot-check
- Does the summary accurately reflect source content?
- Are dates consistent across sources and summary?
- Are actor names spelled correctly and in canonical form?
- Any obviously false or unsupportable claims?

### Step 5: Classification and action

**VALID**: No issues. Log and continue.

**NEEDS_EDIT**: Minor issues you can fix:
- Typos in actor names
- Incorrect source tier
- Missing optional fields
- Minor date format issues
→ Make the edit using the Edit tool, then log.

**NEEDS_REVIEW**: Major issues requiring human judgment:
- Factual claims that can't be verified
- Conflicting sources
- Borderline importance scores
- Contentious framing
→ Log with detailed notes, do not edit.

**REMOVE**: Cannot be validated:
- All sources return 404
- No credible sources exist for the claim
- Event appears fabricated or grossly inaccurate
→ Log with justification for removal.

## Output Format

For EACH event, output a line:
```
[filename] | [STATUS] | [issues/actions if any]
```

At end, provide summary:
```
BATCH [X] COMPLETE
- Total events: N
- Valid: N
- Edited: N
- Flagged for review: N
- Recommended removal: N
- Broken URLs found: N

FLAGGED EVENTS:
- [filename]: [reason]

REMOVAL CANDIDATES:
- [filename]: [reason]
```

## Important Notes
- Work through events systematically by date
- Do not skip events
- Make edits directly when appropriate
- Be conservative with removal recommendations
- Prioritize factual accuracy over style
```

---

## Estimated Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1: Structural | 5 min | Automated |
| Phase 2: URL Check | 2-4 hours | Rate-limited HTTP |
| Phase 3: Agent Validation | 4-8 hours | 22 agent batches |
| Phase 4: Human Review | Variable | Based on flag count |
| Phase 5: Cleanup | 30 min | Deletions + commit |

---

## Success Criteria

- [ ] All 3,619 events have been reviewed
- [ ] All broken source URLs replaced or events removed
- [ ] All structural issues fixed
- [ ] Flagged events have been manually reviewed
- [ ] Invalid/unverifiable events removed
- [ ] Final validation passes with zero errors
- [ ] Changes committed with clear audit trail

---

## Risk Mitigation

**Risk**: Agents make incorrect factual judgments
**Mitigation**: Flag uncertain cases for human review rather than auto-edit

**Risk**: Too many events flagged, overwhelming review queue
**Mitigation**: Set clear thresholds; auto-fix minor issues

**Risk**: Rate limiting on source verification
**Mitigation**: Batch URL checks with delays; cache results

**Risk**: Removing valid events incorrectly
**Mitigation**: Require multiple indicators before removal; maintain removal log for potential restoration

---

## Next Steps (After Plan Approval)

1. Run Phase 1 structural validation
2. Create Phase 2 URL checker script
3. Launch Phase 3 agents in batches of 3-4 parallel
4. Collect and review flagged events
5. Execute removals and commit changes
