# Research Plan: January–February 2026 Gap Fill

## Current State

- **January 2026**: 66 events, covering Jan 1–24. Good density Jan 1–16, then sparse Jan 17–31.
- **February 2026**: 0 events. Complete gap through Feb 15 (today).
- **Key themes from recent events**: ICE operations, DOJ weaponization, Epstein files, Venezuela invasion, Greenland, healthcare, SCOTUS cases, DOGE, Minneapolis crisis, Iran.

## Research Architecture

### Design Principles

1. **Parallel by topic, not date** — each agent owns a topic across the full date range, preventing duplicate events when the same story spans weeks.
2. **Bounded scope** — each agent has 3–5 search queries and a target of 5–10 events. Small enough to complete in one session.
3. **Dedup by checking existing files first** — agents grep `timeline/data/events/2026-0[12]-*` before creating.
4. **Validation gating** — every event runs through `validate_markdown_events.py` and `validate_timeline_dates.py` before the agent reports success.

### Agent Template

Each agent receives:
- Topic name and description
- Specific search queries (3–5)
- Date range: `2026-01-17` through `2026-02-15`
- Target event count: 5–10
- Key actors and tags to use
- Instruction to check existing events to avoid duplicates
- Instruction to use `outlet:` not `publisher:` in sources

---

## Batch 1: High-Frequency Actors/Institutions (7 agents)

These track the most active actors and institutions from recent events.

### Agent 1: Trump Administration Executive Actions
**Queries**:
- "Trump executive order January 2026"
- "Trump executive order February 2026"
- "Trump proclamation order 2026"
- "White House policy announcement January February 2026"
**Key actors**: Donald Trump, White House
**Tags**: executive-overreach, authoritarianism
**Target**: 8–12 events
**Rationale**: Trump EOs are the highest-frequency event type. Weekly cadence.

### Agent 2: DOJ / Pam Bondi / Political Prosecutions
**Queries**:
- "DOJ investigation January 2026"
- "Pam Bondi attorney general 2026"
- "political prosecution federal charges 2026"
- "DOJ civil rights division 2026"
**Key actors**: Pam Bondi, Department of Justice, Lindsey Halligan
**Tags**: doj-weaponization, political-prosecution, institutional-capture
**Target**: 6–10 events
**Rationale**: DOJ weaponization is a core thread. Near-daily developments.

### Agent 3: DOGE / Elon Musk / Government Restructuring
**Queries**:
- "DOGE government efficiency January February 2026"
- "Elon Musk federal government 2026"
- "federal workforce cuts layoffs 2026"
- "DOGE data breach scandal 2026"
**Key actors**: Elon Musk, DOGE, Vivek Ramaswamy
**Tags**: doge, government-restructuring, institutional-capture
**Target**: 6–10 events
**Rationale**: DOGE operations are high-frequency with weekly revelations.

### Agent 4: Immigration / ICE / DHS Operations
**Queries**:
- "ICE raids arrests January February 2026"
- "immigration enforcement operation 2026"
- "DHS deportation January February 2026"
- "ICE civil rights violations 2026"
**Key actors**: ICE, DHS, Kristi Noem, Stephen Miller, Tom Homan
**Tags**: immigration-enforcement, civil-rights, ice
**Target**: 6–10 events
**Rationale**: ICE operations are daily news. Minneapolis crisis continues.

### Agent 5: Congress / Legislation / Oversight
**Queries**:
- "Congress legislation passed January February 2026"
- "House vote bill 2026"
- "Senate confirmation hearing 2026"
- "congressional oversight investigation 2026"
- "discharge petition 2026"
**Key actors**: House Democrats, Senate Republicans, Mike Johnson
**Tags**: congressional-oversight, legislation, institutional-capture
**Target**: 6–10 events
**Rationale**: Legislative activity is medium-frequency but high-importance.

### Agent 6: SCOTUS / Federal Courts / Judicial
**Queries**:
- "Supreme Court ruling decision January February 2026"
- "federal court blocks Trump 2026"
- "SCOTUS oral arguments 2026"
- "judicial nomination confirmation 2026"
**Key actors**: Supreme Court, John Roberts, Federal Courts
**Tags**: judicial-capture, constitutional-crisis, rule-of-law
**Target**: 5–8 events
**Rationale**: Court rulings are the primary check on executive power.

### Agent 7: Epstein Files / Transparency
**Queries**:
- "Epstein files release January February 2026"
- "Epstein documents DOJ 2026"
- "Epstein vote House Senate 2026"
- "Epstein transparency bill 2026"
**Key actors**: DOJ, Thomas Massie, Ro Khanna
**Tags**: epstein, transparency, congressional-oversight
**Target**: 4–6 events
**Rationale**: Active thread with discharge petition forcing votes.

---

## Batch 2: Key Policy Domains (5 agents)

### Agent 8: Healthcare / Medicaid / RFK Jr.
**Queries**:
- "Medicaid cuts January February 2026"
- "RFK Jr HHS policy 2026"
- "ACA Affordable Care Act 2026"
- "vaccine policy CDC 2026"
**Key actors**: RFK Jr., HHS, Medicaid
**Tags**: healthcare, regulatory-capture, public-health
**Target**: 5–8 events

### Agent 9: Foreign Policy / Military / Venezuela / Greenland
**Queries**:
- "Venezuela US military occupation January February 2026"
- "Greenland Denmark US tensions 2026"
- "NATO alliance crisis 2026"
- "Iran protests US policy 2026"
- "Gaza ceasefire negotiations 2026"
**Key actors**: Pete Hegseth, Pentagon, State Department
**Tags**: foreign-policy, military, authoritarianism
**Target**: 6–10 events

### Agent 10: Corporate Corruption / Financial Capture
**Queries**:
- "Trump business conflicts interest 2026"
- "corporate lobbying deregulation 2026"
- "SEC enforcement 2026"
- "cryptocurrency regulation Trump 2026"
- "Trump media deals business 2026"
**Key actors**: Donald Trump, Trump Organization, SEC
**Tags**: conflicts-of-interest, corruption, financial-capture
**Target**: 5–8 events

### Agent 11: Education / Environment / Regulatory Rollback
**Queries**:
- "EPA rollback environmental regulation 2026"
- "education Department cuts 2026"
- "climate policy rollback 2026"
- "federal agency shutdown 2026"
**Key actors**: EPA, Department of Education
**Tags**: regulatory-capture, environmental-destruction, education
**Target**: 4–6 events

### Agent 12: Surveillance / Civil Liberties / Press Freedom
**Queries**:
- "surveillance government monitoring 2026"
- "press freedom journalist arrested 2026"
- "first amendment free speech government 2026"
- "Palantir government contract 2026"
- "protest crackdown 2026"
**Key actors**: FBI, NSA, Palantir
**Tags**: surveillance, first-amendment, civil-liberties
**Target**: 4–6 events

---

## Execution Strategy

### Phase 1: Run Batch 1 (7 agents in parallel)
- High-frequency topics first — these fill the most gaps
- Expected yield: 40–65 events

### Phase 2: Run Batch 2 (5 agents in parallel)
- Policy domains second — these add depth
- Expected yield: 25–40 events

### Phase 3: Gap scan and cleanup
- Review coverage by week — identify any weeks with < 3 events
- Spot-check for major news stories missed by topic-based searches
- Fix any validation errors
- Regenerate API files

### Total expected yield: 65–105 new events

---

## Agent Instructions Template

```
You are researching [TOPIC] for the kleptocracy timeline project.

DATE RANGE: 2026-01-17 through 2026-02-15 ONLY.
Also fill gaps for 2026-01-25 through 2026-01-31 (no existing events).

TARGET: Create [N] validated timeline events.

BEFORE creating any event:
1. Check for duplicates: ls timeline/data/events/2026-0[12]-*[keyword]*
2. Verify the date is within range

EVENT FORMAT — write directly to timeline/data/events/YYYY-MM-DD--slug.md:
---
id: YYYY-MM-DD--slug
date: 'YYYY-MM-DD'
status: confirmed
title: Clear Descriptive Title
importance: 5-10
actors:
- Actor Name
tags:
- lowercase-tag
sources:
- url: https://...
  title: Article Title
  outlet: Publisher Name     # NOTE: use 'outlet' NOT 'publisher'
  date: 'YYYY-MM-DD'
  tier: 1
---

Detailed summary paragraph(s) explaining the event, its context,
and its significance for understanding institutional capture.

AFTER creating each event, validate:
  python3 timeline/scripts/validate_markdown_events.py [filename]
  python3 timeline/scripts/validate_timeline_dates.py [filename]

SEARCH QUERIES: [list]
KEY ACTORS: [list]
KEY TAGS: [list]

Source priorities:
- Tier 1: .gov, AP, Reuters, NPR, PBS, ProPublica
- Tier 2: Bloomberg, CNBC, Axios, CBS/ABC/NBC News
- AVOID: Washington Post, NYT, WSJ (timeout risk with WebFetch)

Report your results with: events created count, list of filenames, any issues.
```

---

## Validation Checkpoint

Before committing any batch, run:
```bash
python3 timeline/scripts/validate_markdown_events.py --staged
python3 timeline/scripts/validate_timeline_dates.py --staged
```

The pre-commit hook will also catch errors, but running manually first saves time.

---

## Fix: Research Executor Agent Template Bug

The agent template at `.claude/agents/research-executor-v2.md` line 82 uses
`publisher:` in the example event format. This should be `outlet:` to match
the schema validator. Fix before launching agents.
