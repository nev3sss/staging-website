---
name: expert-ui-ux-developer
description: 'Design and implement polished, accessible user interfaces and user experiences. Use for UI/UX discovery, visual direction, responsive web layouts, interaction design, frontend implementation, accessibility reviews, and visual QA.'
argument-hint: '[feature, page, or workflow to design or improve]'
user-invocable: true
---

# Expert UI/UX Developer

## Purpose

Create interfaces that are purposeful, usable, accessible, visually distinctive, and technically maintainable. Treat the user workflow as the source of truth: design the smallest clear path to the intended outcome, then make the surrounding states complete and resilient.

## When to Use

- Design or improve a website page, application view, component, or user flow.
- Translate a product requirement, wireframe, or visual brief into frontend code.
- Review an interface for hierarchy, usability, accessibility, responsiveness, or visual polish.
- Diagnose layout, interaction, content, or responsive behavior that makes a UI difficult to use.
- Create or refine a visual system, including typography, color, spacing, controls, motion, and media direction.

## Working Principles

- Start from the audience, task, context, and success signal. Do not start from a decorative layout.
- Prefer the existing framework, components, tokens, content model, and repository conventions.
- Keep page sections full-width and use constrained inner layouts; reserve cards for repeated items, framed tools, and dialogs.
- Use semantic HTML and progressive enhancement. Core navigation, content, and contact paths must work without JavaScript where practical.
- Use familiar controls: icons for tool actions, swatches for color, segmented controls for modes, toggles for binary settings, inputs or steppers for numeric values, and menus for option sets.
- Use Lucide or the repository's established icon library instead of manually drawn interface icons.
- Use expressive, intentional typography and a clear visual direction. Avoid generic default font stacks and purple-on-white boilerplate unless the existing design system requires them.
- Use real, approved media when the user needs to understand a product, place, person, object, or state. Never fabricate claims, logos, testimonials, or operational facts.
- Keep text inside its container at mobile and desktop sizes. Stable dimensions should prevent hover, loading, and content states from shifting layouts.
- Motion should clarify state or hierarchy, respect `prefers-reduced-motion`, and never delay access to content or controls.
- Do not rely on color alone, hidden hover-only actions, placeholder copy, or inaccessible custom controls.

## Procedure

### 1. Frame the problem

1. Identify the concrete anchor: target file, route, component, failing behavior, design reference, or acceptance criterion.
2. State the primary audience, task, and desired outcome in one sentence.
3. List known constraints: framework, browser support, content and asset approvals, performance budget, accessibility target, and existing design rules.
4. Inspect the nearest implementation and neighboring component or page before inventing a pattern.
5. If essential requirements are missing, ask focused questions about audience, content, scope, and success criteria. Otherwise proceed with explicit assumptions.

### 2. Map the experience

1. Describe the happy path from entry to completion.
2. Include empty, loading, error, validation, disabled, focus, hover, pressed, and success states where relevant.
3. Decide the information hierarchy before styling: page purpose, primary action, supporting evidence, secondary actions, and recovery paths.
4. Choose the simplest interaction model that supports the task. Use navigation, tabs, menus, dialogs, or progressive disclosure only when they reduce cognitive load.
5. Check content density, reading order, touch targets, keyboard order, and likely mobile behavior.

### 3. Establish visual direction

1. Define a small set of design tokens for color, typography, spacing, borders, radii, shadows, and motion.
2. Select typography by role and readability, with stable sizes and line lengths; do not scale font size directly with viewport width.
3. Build a balanced palette with sufficient contrast and more than one meaningful hue family. Avoid a single-hue wash or excessive gradients.
4. Choose media, texture, pattern, or background treatment that supports the domain and does not compete with controls or content.
5. Reuse existing brand assets and visual conventions. If a visual asset is unavailable, use a clearly documented placeholder rather than implying it is approved.

### 4. Implement the smallest complete slice

1. Edit the owning component, template, or stylesheet with the smallest coherent change.
2. Keep content, layout, behavior, and styling responsibilities aligned with the repository architecture.
3. Use semantic landmarks, headings, lists, buttons, links, labels, and form controls.
4. Give media explicit dimensions, meaningful alternative text, and an intentional loading strategy.
5. Add keyboard behavior, visible focus, accessible names, and status/error announcements for interactive elements.
6. Implement responsive constraints using grid, flex, aspect ratio, min/max dimensions, and wrapping rather than brittle fixed positioning.
7. Add only a few meaningful transitions or staged reveals. Include a reduced-motion path.

### 5. Validate behavior and visual quality

1. Run the narrowest behavior or component test available immediately after the edit.
2. Run the repository's build, typecheck, lint, or validation command. For this static site, run `python3 scripts/build.py` after changes to registered content or navigation.
3. Inspect the result at narrow mobile, tablet, laptop, and wide desktop widths.
4. Test keyboard-only navigation, focus visibility, zoom to 200%, reduced motion, and a screen-reader spot check when available.
5. Check for clipped text, overlap, unstable layout, unreachable controls, insufficient contrast, missing labels, broken links, missing media, and incorrect reading order.
6. Verify that loading, empty, error, disabled, and success states are understandable without relying on color or animation.
7. Review the page as a user: can the primary task be understood quickly, completed with minimal friction, and recovered from when something goes wrong?

### 6. Review and finish

1. Remove placeholder content, unneeded dependencies, dead styles, and decorative elements that do not support the task.
2. Confirm titles, descriptions, canonical metadata, structured data, link labels, and social previews where the page is public.
3. Confirm privacy, consent, asset licensing, brand approvals, and factual claims before publishing.
4. Document assumptions, known limitations, and any follow-up that requires product, content, legal, or design input.
5. Report what changed and which checks passed or could not be run.

## Decision Points

- **Existing design system:** preserve its tokens and component patterns; only introduce a new pattern when the current system cannot express the requirement.
- **New visual direction:** define tokens and a small representative slice first, then validate it at mobile and desktop before applying it broadly.
- **Missing content or assets:** use a structural placeholder only when necessary, label the assumption in the implementation notes, and do not present placeholder facts as real.
- **JavaScript-dependent interaction:** provide a semantic fallback or a usable non-JavaScript state unless the requirement genuinely depends on client-side behavior.
- **Ambiguous requirement:** choose the option that best supports the primary user task and state the assumption; ask only when different interpretations materially change scope or outcome.
- **Accessibility versus visual treatment:** accessibility is a release requirement. Change the treatment, not the contrast, focus, reading order, or operability requirement.
- **Motion preference or constrained device:** reduce or remove nonessential motion and preserve immediate access to content and controls.

## Definition Of Done

A UI change is complete when:

- The primary user task and hierarchy are clear.
- All relevant interaction and feedback states are implemented.
- The layout remains usable on mobile and desktop without clipping or overlap.
- Keyboard access, focus, labels, contrast, zoom, and reduced motion have been checked.
- Approved content and assets are used, with no misleading placeholders or unverified claims.
- The relevant build, test, lint, or validation check passes.
- Public-page metadata, links, images, and structured data are accurate.
- The final report names the files changed, checks run, and any remaining risk.
