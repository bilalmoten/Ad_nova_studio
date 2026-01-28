Studio 2.2
SaaS UI/UX Master Brief & Design Specification

Status: Build-Ready
Audience: Engineering, Product Design, QA
Target Users: Creative Professionals, Filmmakers, Visual Storytellers

0. Core Product Philosophy

Studio is a professional AI creation cockpit.
It is designed for non-linear exploration, traceable iteration, and explicit creative control.

Non-Negotiable Principles

No hidden state

No irreversible action without confirmation

No AI influence without visibility

No ambiguity in ownership (every asset belongs somewhere)

Every output must be explainable, reproducible, and traceable

1. Visual Identity System (“The Look & Feel”)
1.1 Aesthetic Theme

Neon Noir / Creative Pro

Dark, cinematic base

High contrast for artwork

Accents guide attention, never decorate

The UI must feel expensive, calm, and deliberate

1.2 Color System (Strict Usage Rules)
Base Layers

Canvas Background: Zinc-950 (#09090b)

Panels: Zinc-900 (#18181b)

Borders: rgba(255,255,255,0.08)

Ambient Gradients (Non-Interactive)

Top-Left: Purple #581c87 @ 10%, blur 150px

Bottom-Right: Lime #3f6212 @ 10%, blur 150px

Gradients never appear inside panels

Accent Colors
Accent	Color	Usage Rules
Primary	Electric Lime #a3e635	Primary actions, selections. Max one per panel
Creative	Cyber Purple #c084fc	AI-initiated or AI-assisted actions only
Milestone	Cinema Gold #fbbf24	Final / Approved states. Non-interactive by default
1.3 Glassmorphism Constraints (Mandatory)

Backdrop blur: 16–24px only

Opacity: 80–90%

Only one backdrop-filter per surface

Nested panels reduce opacity by –5%

Never stack blur effects

1.4 Typography

UI & Headings: Inter

Technical / Metadata: JetBrains Mono or Geist Mono

Never mix monospace into descriptive text

1.5 Interaction Physics
Interaction	Behavior
Hover	Scale 1.02, subtle glow
Click	Scale 0.98
Drag	0.8 opacity, cursor-locked
Optimistic UI	Visual state updates instantly; backend sync async
2. Layout Architecture (4 Fixed Zones)
Z-Index Priority (Strict)

Modals

Cockpit (Expanded)

Vault / Context

Stream

Background

Scroll Ownership

Only Zone B (Stream) scrolls vertically

All other zones scroll internally if needed

Opening a modal locks background scroll

3. Zone A — The Vault (Left Sidebar)
Purpose

Asset storage + Narrative control

Dimensions

Collapsed: 72px

Expanded: 280px

Floats above Stream

3.1 Navigation Tabs
Assets Tab

Folder-based collections

Drag Stream → Vault to save

One asset can exist in multiple folders

Scripts Tab — Narrative Spine

This is the canonical story structure.

Script Parsing Rules

Parsing occurs on paste or manual trigger

Priority:

Explicit scene headers

Paragraph breaks

Location/time cues

Scene IDs are immutable

Shot IDs auto-generated (1A, 1B…)

Interaction Rules

Clicking a Shot:

Filters Stream

Updates Cockpit context

Updates breadcrumbs

All generations bind to exactly one Shot

If none selected → bind to “Unassigned”

4. Zone B — The Stream (Center Canvas)
Purpose

The chronological, non-destructive creative record

Ordering Rules

Final / Locked assets

Most recent

Historical

Locked assets remain visible unless explicitly hidden.

4.1 Header Bar (Sticky)

Breadcrumbs: Project → Scene → Shot

Search (filters prompts + metadata)

Grid Density Slider: 2–8 columns

4.2 Asset Card (Core Atom)
Base

Rounded-xl

Zinc-900 background

Zinc-800 border

Asset States (Exclusive)
State	Border	Actions
Draft	Zinc	Full
Generating	Animated Gradient	Disabled
Error	Red	Retry only
Final	Gold	No destructive actions
4.3 Actions

Heart (Save)

Download

Copy Prompt

Use as Reference

Reuse Settings

Lock / Approve

4.4 Lineage Visualization

Only direct parent → child

Max depth visible: 2

Hover highlights relationship

Full tree visible in Detail Modal only

5. Zone C — The Cockpit (Bottom Control Deck)
Purpose

Generation engine + parameter control

Fixed Position

Bottom-center, floating

5.1 Cockpit Header — Active Stack (Always Visible)

Displays all injected context.

Example chips:

Character (Active)

Style (Active)

Seed (Locked)

Rules

Chips update on Shot or Anchor change

Clicking disables for next generation only

Disabled chips auto-reactivate

5.2 Simple Mode (Collapsed)

Height: ~80px

Components:

Reference Upload [+]

Prompt Input

Silent Prompt Decomposer (collapsed)

Generate Button

Expand Controls Trigger

5.3 Prompt Decomposer (Defined Scope)

No chat

No rewriting

Fixed categories:

Subject

Environment

Lighting

Camera

Mood

Motion

Expandable for manual override

5.4 Advanced Mode (Expanded)
Control Priority Order

Manual Overrides

Presets

Prompt Metadata

Defaults

Conflicts highlight overridden values in Lime.

Tabs

Lighting

Visual spheres only

Selection adds explicit tag

Camera

Lens: 16mm, 35mm, 85mm

Angle: Eye, Low, High

Aperture: f/1.4–f/16

Format

Aspect ratios (visual)

Batch size

Raw mode toggle

Motion (Video Only)

Presets (Locked-off, Handheld, etc.)

Presets auto-configure parameters

Manual overrides allowed

6. Zone D — Global Context (Right Sidebar)
Purpose

Persistent Anchors

Behavior

Collapsed strip expands on hover

Anchors apply globally unless disabled

Anchors

Character (FaceID / LoRA)

Style (IP Adapter)

Negative Prompt

Anchors:

Never retroactive

Never affect locked assets

Must appear in Active Stack + Detail Modal

7. Detail Modal (“Light Table”)
Entry

Opens centered

Animates from card

Background dim: 80%

Layout

Left: Asset Canvas

Right: Metadata Sidebar

Required Metadata

Full prompt

All anchors

All overrides

Final resolved parameters

Actions

Mark as Final

Archive

8. Grid / Sprite Sheet Logic

Grid = single immutable image

SVG overlay defines quadrants

Actions:

Upscale → Child asset

Variate → New grid

Parent grid never mutates

9. Interaction States
Loading

Ghost card appears <100ms

Animation min duration: 1.2s

Errors

Red border

Alert icon

Retry only

10. Responsive Rules
Desktop

All zones visible

Laptop

Context collapses

Tablet

Vault collapses
Cockpit simple mode default

Mobile

No hover dependencies

Cockpit becomes full-screen sheet

Stream single column

11. Final Engineering Guardrails

If it influenced output → it must be visible

If it can be changed → it must be reversible

If it is global → it must be explicitly indicated

If it is final → it must be protected