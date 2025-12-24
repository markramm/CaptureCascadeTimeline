# Validation Data Registry

This directory contains the decentralized validation records for the Timeline project.

## Structure
- `schema.json`: Validation record schema.
- `validators/{validator-id}/`: Each validator (human or AI) has a directory.
  - `manifest.json`: Description of the validator.
  - `records/`: Daily or batch validation log files.

## Adding a Validator
Use the CLI tool:
`python scripts/record_validation.py init-validator {id}`

## Verifying an Event
`python scripts/record_validation.py record {event_id} --confidence high --notes "Source checked"`
