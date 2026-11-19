# Context: ForensIQ

## Domain Overview
Digital forensics involves verifying media authenticity, detecting deepfakes, uncovering splice/tamper regions, and analyzing frequency/noise anomalies in digital assets.

## Visual Design & Aesthetics
- **Theme**: High-contrast, sleek cyber-forensics dark mode.
- **Palette**: Deep slate/zinc base (`#0b0f19`), electric indigo/cyan accents, and emerald/amber indicators for authenticity scoring.
- **Micro-interactions**: Subtle hover elevations, active pulse indicators on status badges, and smooth accordion disclosures for diagnostic data.

## Architectural Notes
- Reusable UI primitives in `src/components/` following shadcn-style modular design.
- Utility classes combined using `cn()` from `src/lib/utils.ts`.
