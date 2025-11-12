# Research Plan: August-October 2025 Coverage

**Created**: 2025-10-31
**Status**: Ready for Execution
**Goal**: Fill critical coverage gaps in Aug-Oct 2025 with 80-120 high-quality events

---

## 📊 Current State Analysis

### Coverage Gaps (Critical)
- **August 2025**: 0 events (100% gap)
- **September 2025**: 1 event (99% gap)
- **October 2025**: 0 events (100% gap)

### System Capabilities Assessed

**✅ Available Infrastructure:**
1. **Research-Executor Agent** - Specialized agent with WebSearch, WebFetch, CLI tools
2. **Research CLI** - Complete command-line interface for event creation/validation
3. **Breadth-First Search** - 136 systematic queries already defined
4. **Research Priorities** - 10 prioritized research areas (RP-2025-001 through RP-2025-010)
5. **Quality Standards** - Documented source tiers, importance scoring, validation

**⚠️ System Limitations:**
1. **No Priority Import Tool** - Research priorities JSON exists but no way to bulk import to database
2. **Manual Priority Management** - Would need to manually add each priority via API/database
3. **Research Queue Empty** - System reports "No pending priorities"

**✅ Best Approach:** Direct research workflow without database priorities

---

## 🎯 Recommended Research Strategy

### Phase 1: Manual Breadth-First Collection (Week 1)

**Approach**: Use existing search queries to manually collect events before launching agents

**Tasks**:
1. **Execute systematic web searches** using the 136 queries in `search_queries_sept_oct_2025.json`
2. **Document findings** - Create JSON event stubs for each discovered event
3. **Check for duplicates** - Use `search-events` CLI before documenting
4. **Build event backlog** - Target 80-120 event stubs ready for enhancement

**Priority Order** (from `research_priorities_sept_oct_2025.json`):

**CRITICAL (Do First)**:
1. **RP-2025-001**: DOJ and FBI Activities (10-15 events expected)
2. **RP-2025-002**: Supreme Court and Federal Judiciary (8-12 events)
3. **RP-2025-005**: Executive Actions and Presidential Power (8-12 events)

**HIGH (Do Second)**:
4. **RP-2025-003**: Tech, AI, and Surveillance (12-18 events)
5. **RP-2025-004**: Cryptocurrency and Financial Regulation (8-12 events)
6. **RP-2025-006**: Election Security and Democracy (6-10 events)
7. **RP-2025-007**: Media Censorship and Press Freedom (6-10 events)

**MEDIUM (If Time Permits)**:
8. **RP-2025-008**: Foreign Policy Developments (8-12 events)
9. **RP-2025-009**: Key Actors (Miller, Bannon, Thiel, etc.) (8-12 events)
10. **RP-2025-010**: Climate and Environmental Policy (6-10 events)

**Output**: JSON file with 80-120 event stubs (partial data, needs enhancement)

---

### Phase 2: Agent-Based Event Enhancement (Week 2)

**Approach**: Launch parallel research-executor agents to enhance event stubs

**Setup**:
```bash
# Create event enhancement tasks (one per event stub)
# Each task contains:
# - Event date, preliminary title
# - Initial source(s) found
# - Research area/tags
# - Enhancement instructions
```

**Agent Workflow** (per event):
1. **Validate uniqueness** - Check for duplicates in timeline
2. **Research thoroughly** - Find 2-3 credible sources (tier-1/tier-2)
3. **Enhance event data**:
   - Refine title and summary
   - Add importance score (6-10)
   - Add proper actors and tags
   - Verify dates and facts
4. **Validate format** - Use `validate-event` CLI command
5. **Create event** - Use `create-event` CLI command
6. **Report completion** - Document event ID and quality metrics

**Parallel Processing**:
- Launch 5-10 research-executor agents in parallel
- Each agent gets 8-12 event stubs to enhance
- Agents work independently (no coordination needed)
- Estimated time: 2-4 days for 80-120 events

---

## 📋 Detailed Workflow

### Week 1: Manual Collection Phase

#### Day 1-2: CRITICAL Priorities (RP-001, RP-002, RP-005)

**RP-001: DOJ and FBI Activities**

Search queries (9 total):
```
1. DOJ investigation September 2025
2. DOJ investigation October 2025
3. FBI raid September 2025
4. FBI raid October 2025
5. prosecutor firing September 2025
6. indictment October 2025
7. criminal charges September 2025
8. Pam Bondi September 2025
9. special counsel October 2025
```

For each query:
- Execute WebSearch
- Review results for actual events (not just news analysis)
- Check duplicates: `search-events --query "key terms"`
- Document in JSON stub if unique

**JSON Stub Template**:
```json
{
  "search_query": "DOJ investigation September 2025",
  "date": "2025-09-XX",
  "preliminary_title": "Preliminary event title from search",
  "initial_source": "https://example.com/article",
  "research_area": "RP-2025-001",
  "tags_suggested": ["doj", "investigation"],
  "needs_enhancement": true,
  "notes": "Quick notes about what happened"
}
```

Repeat for RP-002 (Supreme Court) and RP-005 (Executive Actions)

**Expected Output**: 26-39 event stubs

---

#### Day 3-4: HIGH Priorities (RP-003, RP-004, RP-006, RP-007)

Follow same process for:
- Tech/AI/Surveillance (10 search queries)
- Crypto/Finance (8 search queries)
- Election Security (6 search queries)
- Media Censorship (6 search queries)

**Expected Output**: 34-50 event stubs

**Cumulative**: 60-89 event stubs

---

#### Day 5: MEDIUM Priorities & Quality Check

**Tasks**:
1. Execute searches for RP-008, RP-009, RP-010 (time permitting)
2. Review all collected stubs for quality
3. Remove duplicates within stub collection
4. Ensure August coverage (currently 0 events)
5. Organize stubs by enhancement priority

**Expected Output**: 80-120 event stubs ready for enhancement

---

### Week 2: Agent Enhancement Phase

#### Day 6: Agent Setup & Launch

**Preparation**:
1. Organize event stubs into batches of 8-12 events
2. Create enhancement instructions for each batch
3. Prepare agent prompts with:
   - Batch of event stubs to enhance
   - Quality standards and requirements
   - Timeout prevention protocols (avoid WaPo, NYT, WSJ)
   - Duplicate checking procedures

**Launch Agents**:
```bash
# Launch 10 parallel research-executor agents
# Each agent gets one batch (8-12 event stubs)

Agent 1: Batch 1 (DOJ/FBI events)
Agent 2: Batch 2 (Judiciary events)
Agent 3: Batch 3 (Executive Power events)
Agent 4: Batch 4 (Tech/AI events)
Agent 5: Batch 5 (Crypto events)
Agent 6: Batch 6 (Election Security events)
Agent 7: Batch 7 (Media events)
Agent 8: Batch 8 (Foreign Policy events)
Agent 9: Batch 9 (Key Actors events)
Agent 10: Batch 10 (Climate/EPA events)
```

**Agent Prompt Template**:
```
You are a research-executor agent enhancing timeline events.

**Your batch**: [Batch X containing Y event stubs]

**Your task**: For each event stub in your batch:

1. **Check for duplicates**:
   bash
   python3 research-server/cli/research_cli.py search-events --query "[key terms]"


2. **If unique, research thoroughly**:
   - Find 2-3 credible sources (prefer tier-1: .gov, AP, Reuters, NPR, PBS)
   - AVOID paywalled sources: Washington Post, NYT, WSJ (known timeouts)
   - Use WebSearch first, WebFetch only for specific articles
   - Verify dates and facts

3. **Create complete event JSON**:
   json
   {
     "id": "YYYY-MM-DD--descriptive-slug",
     "date": "YYYY-MM-DD",
     "title": "Clear, factual event title",
     "summary": "2-3 paragraph summary with context and significance",
     "importance": 6-9,
     "actors": ["Actor 1", "Actor 2"],
     "tags": ["tag1", "tag2", "tag3"],
     "sources": [
       {
         "url": "https://...",
         "title": "Article Title",
         "publisher": "Publisher Name",
         "date": "YYYY-MM-DD",
         "tier": 1
       }
     ]
   }


4. **Validate and create**:
   bash
   python3 research-server/cli/research_cli.py validate-event --file event.json
   python3 research-server/cli/research_cli.py create-event --file event.json


5. **Report completion**: Document event ID, quality score, sources added

**Quality Requirements**:
- Minimum 2 sources (target 3)
- Importance 6-10 for Aug-Oct 2025 events
- Proper ID format: YYYY-MM-DD--descriptive-slug
- Zero duplicates created

**Your event stubs to enhance**:
[Insert batch of 8-12 event stubs here]

Process all events in your batch and report completion.
```

---

#### Day 7-8: Monitor Progress & Handle Issues

**Monitoring**:
```bash
# Check events created
ls -1 timeline/data/events/2025-08-*.json | wc -l
ls -1 timeline/data/events/2025-09-*.json | wc -l
ls -1 timeline/data/events/2025-10-*.json | wc -l

# Check timeline stats
python3 research-server/cli/research_cli.py get-stats
```

**Handle Issues**:
- Restart stuck agents (timeout on slow sources)
- Manually enhance any remaining stubs
- Quality check created events

---

#### Day 9-10: Quality Assurance & Validation

**QA Process**:
1. Review all newly created events
2. Run validation queue if needed:
   ```bash
   python3 research-server/cli/research_cli.py validation-queue --limit 50
   ```
3. Create validation run for new events:
   ```bash
   python3 research-server/cli/research_cli.py validation-runs-create \
     --run-type date_range \
     --start-date 2025-08-01 \
     --end-date 2025-10-31 \
     --target-count 50
   ```
4. Launch QA agents if needed (see previous QA workflow)

---

## 📊 Success Metrics

### Minimum Success (80 events)
- ✅ August 2025: 15-25 events
- ✅ September 2025: 25-35 events
- ✅ October 2025: 25-35 events
- ✅ All CRITICAL priorities covered (26-39 events)
- ✅ Most HIGH priorities covered (30-40 events)
- ✅ All events have 2+ credible sources
- ✅ Zero duplicates created

### Target Success (100 events)
- ✅ August 2025: 20-30 events
- ✅ September 2025: 30-40 events
- ✅ October 2025: 30-40 events
- ✅ All CRITICAL + HIGH priorities complete (60-89 events)
- ✅ Average 2.5+ sources per event
- ✅ Average importance 7+

### Stretch Success (120+ events)
- ✅ August 2025: 25-35 events
- ✅ September 2025: 35-45 events
- ✅ October 2025: 35-50 events
- ✅ All 10 priorities complete (76-117 events)
- ✅ Average 3+ sources per event
- ✅ Comprehensive coverage across all capture lanes

---

## 🔧 Tools & Resources

### Existing Infrastructure
- `research-server/scripts/breadth_first_search.py` - Search execution tool
- `research-server/search_queries_sept_oct_2025.json` - 136 search queries
- `research-server/research_priorities_sept_oct_2025.json` - 10 priority definitions
- `research-server/RESEARCH_AGENT_INSTRUCTIONS.md` - Complete agent instructions
- `research-server/SYSTEMATIC_RESEARCH_PLAN.md` - Detailed implementation guide

### CLI Commands Reference
```bash
# Search for duplicates
python3 research-server/cli/research_cli.py search-events --query "terms"

# Validate event
python3 research-server/cli/research_cli.py validate-event --file event.json

# Create event
python3 research-server/cli/research_cli.py create-event --file event.json

# Check stats
python3 research-server/cli/research_cli.py get-stats

# Check validation queue
python3 research-server/cli/research_cli.py validation-queue --limit 50
```

---

## ⚠️ Critical Considerations

### Source Quality Tiers

**Tier 1 (Strongly Preferred)**:
- .gov domains (all federal/state government sites)
- Associated Press (ap.org)
- Reuters (reuters.com)
- NPR (npr.org)
- PBS (pbs.org)
- ProPublica (propublica.org)

**Tier 2 (Acceptable)**:
- Bloomberg (bloomberg.com)
- CNBC (cnbc.com)
- Axios (axios.com)
- CBS, ABC, NBC News
- The Guardian (theguardian.com)

**Tier 3 (Use Sparingly)**:
- Industry publications
- Specialized outlets
- Think tank reports

**❌ AVOID (Known Issues)**:
- Washington Post (paywall + WebFetch timeout)
- New York Times (paywall + timeout)
- Wall Street Journal (strict paywall)

### Duplicate Prevention

**ALWAYS check before creating**:
```bash
# Search by key terms
python3 research-server/cli/research_cli.py search-events --query "actor name"
python3 research-server/cli/research_cli.py search-events --query "key terms"

# Check date range
ls -la timeline/data/events/2025-09-*.json | grep -i "keyword"
```

### Agent Timeout Prevention

**If agent appears stuck**:
- Likely hung on WebFetch (washingtonpost.com, nytimes.com)
- Cannot self-recover
- Must interrupt and restart with different approach
- Document problematic URLs

**Prevention Strategy**:
- Use WebSearch first to find articles
- Only WebFetch from known-fast sources
- Skip slow sources immediately (>30 seconds)
- Document alternatives used

---

## 🚀 Getting Started

### Immediate Next Steps

1. **Review search queries**:
   ```bash
   cat research-server/search_queries_sept_oct_2025.json | jq '.queries.level_2.doj_law_enforcement'
   ```

2. **Start manual collection** with RP-001 (DOJ/FBI):
   - Execute 9 search queries
   - Check each result for actual events
   - Verify no duplicates
   - Create event stubs

3. **Track progress** in spreadsheet or JSON file

4. **After 80-120 stubs collected**, proceed to agent enhancement phase

---

## 📝 Notes

- This plan prioritizes **quality over speed**
- Manual collection phase ensures we find the right events
- Agent enhancement phase ensures consistent quality
- Two-phase approach prevents duplicate work and ensures thorough coverage
- Total estimated time: 2 weeks for comprehensive coverage

---

**Ready to begin? Start with Week 1, Day 1: RP-001 DOJ and FBI Activities.**
