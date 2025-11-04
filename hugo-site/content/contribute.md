---
title: "How to Contribute"
date: 2025-01-01
---

## Ways to Contribute

This is a community-driven project. Every contribution helps build our collective understanding of democratic capture.

### 1. Validate Existing Events

Help verify sources and fact-check timeline events:

- Check that sources are still accessible
- Verify facts against original documents
- Identify events that need additional sources
- Flag potential duplicates or inaccuracies

**How**: Browse the timeline, check sources, and [open an issue](https://github.com/markramm/CaptureCascadeTimeline/issues) if you find problems.

### 2. Submit New Events

Add documented events with reliable sources:

**Event Requirements**:
- Minimum 2 credible sources (tier-1 or tier-2)
- Clear date and significance
- Proper formatting (JSON or Markdown)
- Connection to democratic capture patterns

**Source Tiers**:
- **Tier 1**: Court documents, official records, congressional testimony, primary source documents
- **Tier 2**: Verified reporting from established outlets (NYT, WaPo, WSJ, Reuters, AP, ProPublica, etc.)
- **Tier 3**: Secondary analysis from credible researchers

**How**: See our [contribution guide on GitHub](https://github.com/markramm/CaptureCascadeTimeline#contributing).

### 3. Improve Documentation

Help make the timeline more accessible:

- Clarify event summaries
- Improve tagging consistency
- Add context to complex events
- Fix typos and formatting issues

**How**: Submit pull requests or [open an issue](https://github.com/markramm/CaptureCascadeTimeline/issues) with suggestions.

### 4. Technical Contributions

Help improve the infrastructure:

- Enhance the interactive viewer
- Improve search functionality
- Add new visualization features
- Optimize performance

**How**: Check our [GitHub repository](https://github.com/markramm/CaptureCascadeTimeline) for open issues and development guidelines.

### 5. Share and Discuss

Spread awareness and join the conversation:

- Share the timeline on social media
- Discuss patterns in [GitHub Discussions](https://github.com/markramm/CaptureCascadeTimeline/discussions)
- Write analysis of specific patterns
- Help counter disinformation with verified facts

## Event Format

Events can be submitted in either JSON or Markdown format:

### JSON Format

```json
{
  "id": "YYYY-MM-DD--descriptive-slug",
  "date": "YYYY-MM-DD",
  "title": "Event Title",
  "summary": "Detailed summary explaining what happened and why it matters...",
  "importance": 8,
  "tags": ["regulatory-capture", "corruption"],
  "actors": ["Actor Name", "Organization Name"],
  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "publisher": "Publisher Name",
      "date": "YYYY-MM-DD",
      "tier": 1
    }
  ],
  "status": "confirmed"
}
```

### Markdown Format

```markdown
---
id: YYYY-MM-DD--descriptive-slug
date: YYYY-MM-DD
title: Event Title
importance: 8
tags:
  - regulatory-capture
  - corruption
actors:
  - Actor Name
  - Organization Name
sources:
  - url: https://example.com/article
    title: Article Title
    publisher: Publisher Name
    date: YYYY-MM-DD
    tier: 1
status: confirmed
---

Detailed summary explaining what happened and why it matters...
```

## Contribution Guidelines

### Quality Standards

1. **Accuracy First**: Every fact must be verifiable
2. **Neutral Tone**: Document what happened, not opinions
3. **Clear Significance**: Explain why it matters
4. **Proper Sourcing**: Cite credible, accessible sources

### Dos and Don'ts

**Do**:
- ✅ Use credible, verifiable sources
- ✅ Provide context and significance
- ✅ Check for duplicates before submitting
- ✅ Follow the event format exactly
- ✅ Include importance scores (1-10 scale)

**Don't**:
- ❌ Submit events without sources
- ❌ Use partisan or biased language
- ❌ Include speculation or predictions
- ❌ Submit duplicates of existing events
- ❌ Use unreliable or questionable sources

### Getting Started

1. **Fork the repository** on GitHub
2. **Create a new branch** for your changes
3. **Add your event(s)** in the `timeline/data/events/` directory
4. **Test locally** if possible
5. **Submit a pull request** with a clear description

## Code of Conduct

This project adheres to a strict code of conduct:

- **Be respectful** and professional
- **Focus on facts**, not opinions
- **Assume good faith** in disagreements
- **Prioritize accuracy** over speed
- **Welcome constructive feedback**

## Questions?

- **General questions**: [GitHub Discussions](https://github.com/markramm/CaptureCascadeTimeline/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/markramm/CaptureCascadeTimeline/issues)
- **Technical help**: Check our [README](https://github.com/markramm/CaptureCascadeTimeline#readme)

## License

By contributing, you agree that your contributions will be licensed under:
- **Data**: CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike)
- **Code**: MIT License

This ensures the timeline remains free and open for everyone.

---

**Thank you for helping document the capture of democracy. Your contributions make a difference.**
