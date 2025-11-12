#!/usr/bin/env python3
"""Convert JSON events to Markdown and copy to CaptureCascadeTimeline repository."""

import json
import yaml
import shutil
from pathlib import Path

# Event files to convert
events = [
    "2025-04-20--vance-vatican-easter-visit.json",
    "2025-04-21--pope-francis-death.json",
    "2025-05-08--pope-leo-xiv-election.json",
    "2025-10-01--pope-leo-xiv-prolife-immigration.json",
    "2025-10-15--hegseth-pentagon-congress-communications-ban.json",
    "2025-10-30--ice-shoots-us-citizen-carlos-jimenez.json",
    "2025-11-03--medicaid-work-requirements-2027.json",
    "2025-11-03--snap-partial-benefits-announced.json",
    "2025-11-04--barbara-wien-stephen-miller-investigation.json",
    "2025-11-04--dhs-mobile-identify-facial-recognition-app.json",
    "2025-11-04--memphis-safe-task-force-racial-profiling.json",
    "2025-11-04--pope-leo-xiv-ice-clergy-access.json",
    "2025-11-04--trump-china-tariff-executive-orders.json",
    "2025-11-05--faa-air-traffic-reduction-shutdown-crisis.json",
    "2025-11-05--government-shutdown-longest-history-day-36.json",
    "2025-11-05--mamdani-wins-nyc-mayor-historic-muslim-victory.json",
    "2025-11-06--faa-announces-10-percent-air-traffic-reduction.json",
    "2025-11-06--glen-casada-pardon-tennessee-corruption.json",
    "2025-11-06--kazakhstan-abraham-accords-announcement.json",
    "2025-11-06--supreme-court-snap-emergency-stay.json",
    "2025-11-06--trump-weight-loss-drug-deals-lilly-novo.json",
    "2025-11-07--cornell-university-settlement-60-million.json",
    "2025-11-07--ice-broadview-prayer-ban-first-amendment.json",
    "2025-11-07--supreme-court-blocks-full-snap-payments.json",
    "2025-11-08--education-department-autoresponder-first-amendment-ruling.json",
    "2025-11-09--trump-2000-tariff-dividend-announcement.json",
    "2025-11-10--first-circuit-snap-ruling-trump-appeal.json",
    "2025-11-10--marine-corps-250th-anniversary-proclamation.json",
    "2025-11-10--trump-pardons-77-election-overturn-conspirators.json",
    "2025-11-10--trump-veterans-day-proclamation.json"
]

# Paths
kleptocracy_events = Path("/Users/markr/kleptocracy-timeline/timeline/data/events")
cascade_events = Path("/Users/markr/CaptureCascadeTimeline/timeline/data/events")

# Ensure cascade directory exists
cascade_events.mkdir(parents=True, exist_ok=True)

converted_count = 0
for event_file in events:
    json_path = kleptocracy_events / event_file
    md_filename = event_file.replace('.json', '.md')
    md_path = cascade_events / md_filename

    try:
        # Read JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Extract summary
        summary = data.pop('summary', '')

        # Write markdown with YAML frontmatter
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write('---\n')
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            f.write('---\n\n')
            f.write(summary)
            f.write('\n')

        print(f"✓ Converted and copied: {md_filename}")
        converted_count += 1

    except Exception as e:
        print(f"✗ Error with {event_file}: {e}")

print(f"\n✓ Successfully converted and copied {converted_count}/{len(events)} events to CaptureCascadeTimeline")
