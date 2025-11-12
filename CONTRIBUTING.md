# Contributing to the Capture Cascade Timeline

Thank you for your interest in contributing to this project! This timeline documents the systematic erosion of democratic institutions, and we welcome contributions that help make it more comprehensive, accurate, and accessible.

## Ways to Contribute

### 1. Submit New Events

Add documented events with credible sources that show patterns of institutional capture, corruption, or democratic erosion.

**Requirements:**
- Minimum 2 credible sources (tier-1 or tier-2)
- Clear date and significance
- Proper formatting (JSON or Markdown)
- Evidence-based claims only

### 2. Validate Existing Events

Help verify sources, fact-check claims, and ensure accuracy:
- Check that sources are still accessible
- Verify facts against primary sources
- Report broken links
- Suggest corrections via GitHub issues

### 3. Improve Documentation

- Fix typos and improve clarity
- Add context to events
- Improve event summaries
- Enhance tag taxonomy

### 4. Code Contributions

Improve the viewer application or data processing scripts:
- Bug fixes
- UI/UX improvements
- Performance optimizations
- New features

## Event Submission Guidelines

### Source Quality Requirements

**Tier 1 Sources** (Strongest):
- Court records and legal filings
- Official government documents
- Congressional testimony
- Inspector General reports
- Regulatory filings (SEC, FEC, etc.)
- Academic peer-reviewed research

**Tier 2 Sources** (Strong):
- Established investigative journalism (NYT, WaPo, ProPublica, etc.)
- Major news outlets with editorial standards
- Trade publications with expertise
- Verified primary documents

**Not Acceptable**:
- Social media posts (unless as supplementary evidence)
- Blogs without editorial standards
- Unverified claims
- Partisan opinion pieces without factual basis
- Conspiracy theories

### Event Format

Events can be submitted in JSON or Markdown format. Both must include:

#### Required Fields:
- `id`: Unique identifier (format: `YYYY-MM-DD--event-slug`)
- `date`: Event date (YYYY-MM-DD)
- `title`: Clear, factual title (60-100 characters)
- `summary`: Detailed description (2-4 paragraphs)
- `importance`: Significance rating (1-10)
- `tags`: Relevant categorization tags
- `actors`: Key individuals/organizations involved
- `sources`: At least 2 credible sources with URLs

#### Optional Fields:
- `status`: Verification status (confirmed, validated, disputed, etc.)
- `notes`: Additional context or analysis
- `location`: Geographic location if relevant
- `capture_lanes`: Applicable capture cascade categories

### JSON Format Example

```json
{
  "id": "2025-01-15--example-event",
  "date": "2025-01-15",
  "title": "Event Title: Clear and Factual",
  "summary": "Detailed summary paragraph describing what happened, who was involved, and why it matters. Include specific facts, dates, and context.\n\nSecond paragraph providing additional details, consequences, or connections to broader patterns.",
  "importance": 7,
  "status": "confirmed",
  "tags": [
    "corruption",
    "regulatory-capture",
    "conflicts-of-interest"
  ],
  "actors": [
    "Key Person",
    "Organization Name",
    "Government Agency"
  ],
  "capture_lanes": [
    "Regulatory Capture & Corporate Control"
  ],
  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "publisher": "Publisher Name",
      "date": "2025-01-15",
      "tier": 1
    },
    {
      "url": "https://example.com/document",
      "title": "Court Filing or Official Document",
      "publisher": "Court or Agency Name",
      "date": "2025-01-14",
      "tier": 1
    }
  ]
}
```

### Markdown Format Example

```markdown
---
id: 2025-01-15--example-event
date: 2025-01-15
title: Event Title: Clear and Factual
importance: 7
status: confirmed
tags:
  - corruption
  - regulatory-capture
  - conflicts-of-interest
actors:
  - Key Person
  - Organization Name
  - Government Agency
capture_lanes:
  - Regulatory Capture & Corporate Control
sources:
  - url: https://example.com/article
    title: Article Title
    publisher: Publisher Name
    date: 2025-01-15
    tier: 1
  - url: https://example.com/document
    title: Court Filing or Official Document
    publisher: Court or Agency Name
    date: 2025-01-14
    tier: 1
---

Detailed summary paragraph describing what happened, who was involved, and why it matters. Include specific facts, dates, and context.

Second paragraph providing additional details, consequences, or connections to broader patterns.
```

## Importance Rating Guidelines

Rate events on a scale of 1-10 based on their significance:

- **10 (Critical)**: Constitutional crisis, coup attempts, major institutional collapse
- **9 (Severe)**: Major corruption scandals, systematic capture of key institutions
- **8 (High)**: Significant regulatory capture, major conflicts of interest
- **7 (Notable)**: Important policy decisions enabling corruption
- **6 (Moderate)**: Concerning patterns, regulatory failures
- **5 (Standard)**: Documented instances of institutional problems
- **1-4 (Minor)**: Background events, context-building information

## Tag Taxonomy

Use consistent tags from these categories:

**Corruption Types:**
- `corruption`, `bribery`, `kleptocracy`, `conflicts-of-interest`, `embezzlement`

**Institutional Capture:**
- `regulatory-capture`, `judicial-capture`, `legislative-capture`, `media-capture`, `institutional-capture`

**Democratic Erosion:**
- `voter-suppression`, `gerrymandering`, `election-interference`, `constitutional-crisis`

**Sectors:**
- `finance`, `healthcare`, `energy`, `defense`, `technology`, `telecommunications`

See [timeline/docs/TAG_TAXONOMY.md](timeline/docs/TAG_TAXONOMY.md) for the complete list.

## Submission Process

### For Event Submissions:

1. **Fork the repository** on GitHub
2. **Create a new event file** in `timeline/data/events/` following the naming convention: `YYYY-MM-DD--event-slug.json` or `.md`
3. **Validate your event** by running:
   ```bash
   cd timeline
   python scripts/validate_events.py --file data/events/your-event-file.md
   ```
4. **Create a pull request** with:
   - Clear description of the event
   - Why it's significant
   - Confirmation that sources are credible

### For Code Contributions:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with clear, atomic commits
4. **Test your changes**:
   ```bash
   cd timeline/viewer
   npm test
   npm run build
   ```
5. **Submit a pull request** with:
   - Description of changes
   - Why the change is needed
   - Any breaking changes noted

## Code of Conduct

### Our Standards

- **Be factual**: All claims must be supported by credible sources
- **Be respectful**: Disagree with ideas, not people
- **Be collaborative**: Work together to improve accuracy
- **Be transparent**: Cite sources, show your work
- **Be accountable**: Accept corrections gracefully

### Unacceptable Behavior

- Submitting false or misleading information
- Personal attacks or harassment
- Partisan spin over factual accuracy
- Plagiarism or uncited sources
- Bad faith contributions

## Questions?

- **Event format questions**: See [timeline/docs/EVENT_FORMAT.md](timeline/docs/EVENT_FORMAT.md)
- **Source quality questions**: See [timeline/docs/SOURCE_QUALITY.md](timeline/docs/SOURCE_QUALITY.md)
- **Technical questions**: Open an issue on GitHub
- **General questions**: Start a discussion on GitHub Discussions

## License

By contributing, you agree that:
- **Event data** will be licensed under [CC BY-SA 4.0](LICENSE-DATA)
- **Code contributions** will be licensed under [MIT License](LICENSE-MIT)

---

**"Democracy depends on documentation. Thank you for contributing to the historical record."**
