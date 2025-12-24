# Validation Fix Plan

Generated: 2024-12-24

## Summary
- **Total files with issues**: 43
- **Total errors**: 89

## Issue Categories

### 1. Date Range IDs (6 files)
Files with date ranges in ID that need to be converted to single dates:

| File | Issue | Fix Strategy |
|------|-------|--------------|
| `1980-1992--el-salvador-death-squads-us-support.md` | Range ID | Use start date: 1980-01-01 |
| `1982-1986--reagan-marcos-kleptocracy-support.md` | Range ID | Use start date: 1982-01-01 |
| `1991-2009--trump-six-bankruptcies-pattern.md` | Range ID | Use first bankruptcy date |
| `1998-2016--deutsche-bank-loans-trump-2-5-billion-russian-laundering.md` | Range ID | Use start date: 1998-01-01 |
| `2004-2015--apprentice-conflicts-of-interest-trump-properties.md` | Range ID | Use start date: 2004-01-01 |
| `2005-2024--bankruptcy-weaponized-students-corps-shield-assets.md` | Range ID | Use start date: 2005-01-01 |
| `2011-2024--boeing-737-max-scandal-summary-346-deaths-zero-prosecutions.md` | Range ID | Use start date: 2011-01-01 |

**Action**: Rename files and update IDs to use start date with -01-01.

### 2. Partial Dates (9 files)
Files with YYYY or YYYY-MM format instead of YYYY-MM-DD:

| File | Current Date | Fix |
|------|--------------|-----|
| `2012-01-01--mckinsey-ukraine-yanukovych-manafort.md` | 2012 | 2012-01-01 |
| `2015-12-01--mckinsey-saudi-vision-2030-blueprint.md` | 2015-12 | 2015-12-01 |
| `2016-12-01--mckinsey-saudi-twitter-dissidents-report.md` | 2016-12 | 2016-12-01 |
| `2017-01-01--mckinsey-china-state-owned-enterprises.md` | 2017 | 2017-01-01 |
| `2017-02-01--mckinsey-ice-detention-cost-cutting.md` | 2017-02 | 2017-02-01 |
| `2018-01-01--mckinsey-russia-kremlin-sanctions.md` | 2018 | 2018-01-01 |
| `2019-03-01--mckinsey-sneader-murderer-client-question.md` | 2019-03 | 2019-03-01 |
| `2022-09-01--when-mckinsey-comes-to-town-published.md` | 2022-09 | 2022-09-01 |
| `2023-06-01--congressional-investigation-mckinsey-china-military.md` | 2023-06 | 2023-06-01 |

**Action**: Update date field to full YYYY-MM-DD format (use -01 for day).

### 3. Placeholder/Invalid URLs (20+ files)
Files with URLs not starting with http:// or https://

**High priority** - Need real sources found:
- `1142-01-01--haudenosaunee-democratic-consensus-model.md` (4 bad URLs)
- `1600-01-01--pre-colonial-democratic-innovations.md` (1 bad URL)
- `1997-10-14--indonesia-imf-loan-conditions-announced.md` (8 bad URLs)
- `2017-01-01--russian-oligarch-kerimov-acquires-*` (2 duplicate files, 12 bad URLs)
- `2022-10-01--musk-begins-regular-contact-with-vladimir-putin-*` (10 bad URLs)
- `2025-01-20--j.d.-vance-inaugurated-as-vice-president-*` (4 bad URLs)
- `2025-02-01--schedule-f-implementation-targets-*` (3 bad URLs)
- `2025-06-01--federal-workforce-shrinks-*` (5 bad URLs)
- `2025-07-15--climate-programs-dismantled-*` (3 bad URLs)
- `2025-08-15--education-department-faces-*` (3 bad URLs)

**Lower priority** - Just 1-2 bad URLs:
- `1973-01-01--bcci-rapid-expansion-begins-*` (1 bad URL - url is not string)
- `1987-04-01--federal-reserve-approves-section-20-*` (1 bad URL)
- `1995-01-01--k-street-project-launch-*` (2 bad URLs)
- `2024-03-15--state-department-internal-resistance-*` (1 bad URL)
- `2025-01-15--grok-ai-first-major-public-safety-*` (4 bad URLs)
- `2025-04-24--a-side-hustle-for-friends-of-musk-*` (1 bad URL)

**Action**: Research and find valid source URLs for each event.

### 4. Missing Sources (7 files)
Files with no sources at all:

| File | Action |
|------|--------|
| `2025-11-01--test-markdown-creation-final.md` | **DELETE** - test file |
| `2025-12-08--boasberg-orders-doj-testimony-alien-enemies-act.md` | Research sources |
| `2025-12-08--fort-bliss-detention-torture-abuse-allegations.md` | Research sources |
| `2025-12-08--immigration-judge-purge-100-judges-fired.md` | Research sources |
| `2025-12-08--state-department-85000-visa-revocations.md` | Research sources |
| `2025-12-08--supreme-court-independent-agency-firing-humphreys-executor.md` | Research sources |
| `2025-12-09--doj-eliminates-disparate-impact-civil-rights-protections.md` | Research sources |

**Action**: Delete test file. Research and add sources for the 6 real events.

### 5. Enhanced Prefix Files (3 files)
Files with `enhanced_` prefix breaking ID format:

| File | Action |
|------|--------|
| `enhanced_2025-01-20--coordinated-federal-workforce-purge-schedule-f-doj.md` | Rename, remove prefix |
| `enhanced_2025-03-01--project-2025-authors-fill-key-administration-positions-1757456630.md` | Rename, remove prefix |
| `enhanced_2025-08-26--doge-social-security-data-breach.md` | Rename, remove prefix |

**Action**: Rename files to remove `enhanced_` prefix. Update ID field to match.

## Execution Plan

### Phase 1: Quick Fixes (Can be scripted)
1. Delete test file
2. Fix partial dates (add -01 for day)
3. Rename enhanced_ files

### Phase 2: Date Range Files (Manual review)
1. Review each file to determine best single date
2. Rename file and update ID

### Phase 3: Source Research (Research agents)
1. Launch research agents to find valid URLs for placeholder sources
2. Add sources to files missing them entirely

### Phase 4: Duplicate Detection
Check if any files are duplicates:
- `2017-01-01--russian-oligarch-kerimov-*` (two similar files)

## Priority Order
1. **P1**: Delete test file, fix enhanced_ prefix (quick wins)
2. **P2**: Fix date formats (scripted)
3. **P3**: Research sources for 2025-12-08 events (recent, findable)
4. **P4**: Research sources for placeholder URLs
5. **P5**: Fix date range IDs (requires review)
