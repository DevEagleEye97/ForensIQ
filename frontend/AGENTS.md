# Agent Guidelines & Workflow Engine

This workspace is powered by **Get Shit Done (GSD)** spec-driven context engineering and **UI/UX Pro Max** design intelligence.

---

## 1. Get Shit Done (GSD) Workflow Loop

To prevent context rot and ensure high quality, development follows the disciplined GSD lifecycle:
1. **Discuss**: Capture implementation decisions, user constraints, and trade-offs before generating code.
2. **Plan**: Break tasks into actionable increments mapped to `.planning/ROADMAP.md` and `.planning/phases/`.
3. **Execute**: Implement planned tasks in clean steps, validating each component along the way.
4. **Verify**: Test functionality, accessibility, and visual styling against requirements.
5. **Ship**: Finalize milestones, update `.planning/STATE.md`, and record progress.

### State & Memory Files (`.planning/`)
- `.planning/PROJECT.md`: Project vision, core boundaries, and stack definitions.
- `.planning/REQUIREMENTS.md`: Scoped functional and non-functional requirements.
- `.planning/ROADMAP.md`: Sequential milestones and phase breakdown.
- `.planning/STATE.md`: Active phase, blockers, recent achievements, and key decisions.
- `.planning/CONTEXT.md`: User preferences, architectural notes, and domain specifics.

---

## 2. UI/UX Pro Max Design Intelligence

The **UI/UX Pro Max** skill suite is located in `.agents/skills/`:
- `ui-ux-pro-max`: Core design engine with 80 UI styles, 194 color palettes, 74 font pairings, 130 UX guidelines, and 25 chart specs.
- `ui-styling`: Tailwind CSS & component styling best practices.
- `design-system`: Design tokens, CSS variables, and layout systems.
- `brand`, `banner-design`, `slides`: Assets, pitch decks, and brand styling.

### Mandatory UX Rules:
- **Accessibility**: Minimum contrast 4.5:1 for text, descriptive alt text, full keyboard navigation, and explicit aria-labels on icon buttons.
- **Touch Targets**: Minimum interactive size of 44×44px with 8px+ spacing between touch items.
- **Responsiveness**: Mobile-first fluid design, zero horizontal viewport overflow, and adaptive typography.
- **Feedback & Motion**: Loading states on async actions, smooth 150–300ms transitions, and respect for `prefers-reduced-motion`.
