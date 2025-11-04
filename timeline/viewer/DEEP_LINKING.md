# Deep Linking Strategy - Timeline Viewer

The Timeline Viewer implements a comprehensive deep linking system that allows users to share and bookmark specific views, filters, and events via URL parameters. This document describes all supported URL parameters and their behavior.

## Overview

The deep linking system enables:
- 📌 **Direct event linking** - Link to specific events
- 🔍 **Filter persistence** - Share filtered views with others
- 🎨 **View state preservation** - Maintain UI state across sessions
- 📱 **Mobile sharing** - Native share sheet support on mobile devices
- 🔗 **SEO-friendly URLs** - Clean, readable URL structure

## URL Parameter Reference

### Core Navigation

#### `event` - Direct Event Linking
Links directly to a specific event and opens its detail view.

**Format**: `?event={event-id}`

**Example**:
```
https://www.capturecascade.org/viewer/?event=2025-01-15--trump-crypto-deal
```

**Behavior**:
- Opens the event detail panel automatically
- Scrolls to the event in the timeline
- Can be combined with filters to show event in context

---

### Filtering Parameters

#### `tags` - Filter by Tags
Filter events by one or more tags.

**Format**: `?tags={tag1,tag2,tag3}`

**Example**:
```
https://www.capturecascade.org/viewer/?tags=corruption,conflicts-of-interest
```

**Behavior**:
- Shows only events with ANY of the specified tags
- Multiple tags are comma-separated (no spaces)
- Tag names must match exactly (case-sensitive)

---

#### `actors` - Filter by Actors
Filter events by key actors/individuals.

**Format**: `?actors={actor1,actor2,actor3}`

**Example**:
```
https://www.capturecascade.org/viewer/?actors=Trump,Musk,Thiel
```

**Behavior**:
- Shows only events involving ANY of the specified actors
- Multiple actors are comma-separated
- Actor names must match exactly

---

#### `lanes` - Filter by Capture Lanes
Filter events by institutional capture categories.

**Format**: `?lanes={lane1,lane2}`

**Example**:
```
https://www.capturecascade.org/viewer/?lanes=judicial,regulatory
```

**Supported Values**:
- `judicial` - Judicial system capture
- `regulatory` - Regulatory agency capture
- `legislative` - Legislative process capture
- `media` - Media capture
- `electoral` - Electoral system manipulation

---

#### `dateRange` - Filter by Date Range
Filter events within a specific date range.

**Format**: `?dateRange={start-date}:{end-date}`

**Examples**:
```
# Events from Jan 2020 to Dec 2024
?dateRange=2020-01-01:2024-12-31

# Events after Jan 2023 (no end date)
?dateRange=2023-01-01:

# Events before Dec 2024 (no start date)
?dateRange=:2024-12-31
```

**Format Notes**:
- Dates must be in `YYYY-MM-DD` format
- Both start and end are optional
- Colon separator is required

---

#### `search` - Full-Text Search
Filter events by keyword search.

**Format**: `?search={query}`

**Example**:
```
https://www.capturecascade.org/viewer/?search=cryptocurrency
```

**Behavior**:
- Searches event titles and summaries
- URL-encoded automatically
- Case-insensitive matching

---

### View Mode Parameters

#### `view` - Display Mode
Switch between different visualization modes.

**Format**: `?view={mode}`

**Supported Values**:
- `timeline` (default) - Chronological timeline view
- `network` - Actor network graph
- `actors` - Actor-focused network
- `stats` - Statistics dashboard

**Example**:
```
https://www.capturecascade.org/viewer/?view=network&actors=Trump,Musk
```

---

### Timeline Display Controls

#### `timeline` - Timeline UI Controls
Controls timeline display settings (compact mode, sorting, importance filter, minimap).

**Format**: `?timeline={compactMode},{sortBy},{filterImportance},{showMinimap}`

**Default**: `medium,date,0,true`

**Parameters**:
1. **compactMode**: `compact` | `medium` | `expanded`
2. **sortBy**: `date` | `importance`
3. **filterImportance**: `0-10` (minimum importance to show)
4. **showMinimap**: `true` | `false`

**Examples**:
```
# Compact view, sorted by importance, show only 8+ importance
?timeline=compact,importance,8,true

# Expanded view, sorted by date, show all, hide minimap
?timeline=expanded,date,0,false
```

---

#### `zoom` - Timeline Zoom Level
Controls the zoom level of the timeline view.

**Format**: `?zoom={level}`

**Default**: `1`

**Range**: `0.5` - `3.0`

**Example**:
```
?zoom=1.5
```

---

### UI State Parameters

#### `filters` - Show/Hide Filter Panel
Controls filter panel visibility.

**Format**: `?filters={true|false}`

**Default**: `true` (shown)

**Example**:
```
?filters=false
```

---

#### `stats` - Show/Hide Stats Panel
Controls statistics panel visibility.

**Format**: `?stats={true|false}`

**Default**: `false` (hidden)

**Example**:
```
?stats=true
```

---

#### `landing` - Show Landing Page
Forces the landing page to display.

**Format**: `?landing=true`

**Default**: Not shown (goes directly to viewer)

**Example**:
```
https://www.capturecascade.org/viewer/?landing=true
```

**Note**: Since the Hugo static site now serves as the main landing page, this parameter is rarely needed.

---

## Combining Parameters

Multiple parameters can be combined to create sophisticated deep links:

### Example 1: Specific Event with Context
Show a specific event with related filters:
```
?event=2025-01-15--trump-crypto-deal&actors=Trump,Musk&tags=cryptocurrency,conflicts-of-interest
```

### Example 2: Filtered Time Period
Show events from a specific period with specific actors:
```
?dateRange=2024-01-01:2024-12-31&actors=Trump&view=timeline&timeline=compact,importance,7,true
```

### Example 3: Network Analysis
Show actor network for specific time period:
```
?view=network&dateRange=2023-01-01:2025-12-31&actors=Trump,Musk,Thiel,Vance
```

### Example 4: Research Query
Full-text search with filters and stats:
```
?search=surveillance&tags=privacy,national-security&stats=true&view=timeline
```

### Example 5: Presentation Mode
Clean view for presentations:
```
?filters=false&stats=false&timeline=expanded,date,8,false
```

---

## URL State Management

### Automatic URL Updates

The viewer automatically updates the URL as you interact with it:
- ✅ Filter changes are reflected in the URL
- ✅ View mode switches update the URL
- ✅ Event selection adds event parameter
- ✅ Uses `replaceState` to avoid polluting browser history

### Browser Navigation Support

- ✅ **Back/Forward buttons** restore previous filter states
- ✅ **Bookmarks** preserve exact view state
- ✅ **Page refresh** maintains current filters and view

### URL Encoding

- Spaces and special characters are URL-encoded automatically
- Commas separate multiple values in array parameters
- Empty values are omitted to keep URLs clean

---

## Sharing Functionality

The viewer includes built-in sharing features:

### Share Specific Event
Click the share icon on any event to generate a deep link.

**Generated URL includes**:
- Event ID
- Current filters (optional)
- View mode

### Share Current View
Use the share button to copy the current filtered view URL.

**Generated URL includes**:
- All active filters
- Current view mode
- Timeline display settings

### Mobile Native Share
On mobile devices, the native share sheet is automatically used when available.

---

## Use Cases

### For Researchers
```
# Share a specific pattern of events
?tags=regulatory-capture,revolving-door&dateRange=2020-01-01:2024-12-31&view=stats
```

### For Journalists
```
# Link to specific story with context
?event=2024-03-15--agency-appointment&actors=NewHead&tags=conflicts-of-interest
```

### For Educators
```
# Teaching example showing timeline progression
?dateRange=2016-01-01:2024-12-31&timeline=expanded,date,6,true&actors=Trump
```

### For Social Media
```
# Quick visual reference
?view=network&actors=Trump,Musk,Thiel&dateRange=2023-01-01:
```

---

## Implementation Details

### Code Location
- **URL State Hook**: `timeline/viewer/src/hooks/useUrlState.js`
- **Share Utilities**: `timeline/viewer/src/utils/shareUtils.js`
- **Main Application**: `timeline/viewer/src/App.js`

### Key Features
- **Bidirectional sync**: App state ↔ URL parameters
- **Clean URLs**: Only non-default values are included
- **Error handling**: Invalid parameters are ignored gracefully
- **Type safety**: Parameters are validated and parsed correctly

---

## Best Practices

### For Sharing Links
1. ✅ **Be specific**: Include relevant filters for context
2. ✅ **Keep it simple**: Only include necessary parameters
3. ✅ **Test links**: Verify they work in incognito mode
4. ✅ **Use readable values**: Tag/actor names are case-sensitive

### For Integration
1. ✅ **Use Hugo permalinks**: Link to individual event pages for SEO
2. ✅ **Add viewer links**: Include "View in Timeline" buttons with deep links
3. ✅ **Preserve context**: Pass relevant filters when linking from other pages

### URL Length Considerations
- Maximum URL length: ~2000 characters (browser dependent)
- Be mindful when selecting many filters
- Use search query for broad filtering instead of many tags

---

## Future Enhancements

Potential additions to the deep linking system:

- 🔮 **Saved views**: Named filter combinations
- 🔮 **Short URLs**: URL shortener integration
- 🔮 **QR codes**: Generate QR codes for presentations
- 🔮 **Embed codes**: iFrame embedding with parameters
- 🔮 **Export formats**: CSV/JSON export of current view

---

## Troubleshooting

### Link Doesn't Load Correctly
- Check that parameter names are spelled correctly
- Verify date format is `YYYY-MM-DD`
- Ensure tag/actor names match exactly (case-sensitive)
- Check for URL encoding issues in special characters

### Filters Not Applied
- Wait for page to fully load
- Check browser console for errors
- Verify parameter syntax (commas, no spaces)
- Try a hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### URL Too Long
- Reduce number of selected filters
- Use search query instead of many tags
- Focus on most important actors/tags

---

## Related Documentation

- [Event Format Documentation](../docs/EVENT_FORMAT.md)
- [Viewer Architecture](./ARCHITECTURE.md)
- [API Integration](./API_INTEGRATION.md)

---

**Last Updated**: November 2024
**Version**: 1.0.0
