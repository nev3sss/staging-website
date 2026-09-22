# Prompt for MEAICON: Enterprise-Grade Modern Website Design

**Objective:** Recreate a premium, enterprise-focused website design that conveys technical credibility, trust, and innovation for a global IT infrastructure and managed services provider. The design must balance sophisticated aesthetics with exceptional usability and performance.

---

## Visual Identity Requirements

### Color System

- **Primary Background**: Deep navy/charcoal (near-black, not pure `#000000`) for hero sections, footers, and dark content bands—creates premium, serious tone.
- **Accent Color**: Electric blue (`#0066FF` range) for all primary CTAs, active links, and key interactive elements—use sparingly for maximum contrast and impact.
- **Neutral Palette**: Warm grays and off-whites for body text and card backgrounds to ensure readability and reduce eye strain across light and dark sections.
- **Gradients**: Subtle blue-to-purple or blue-to-teal gradients on buttons, section dividers, and hover states—add depth without visual overwhelm.

### Typography

- **Headlines**: Bold, geometric sans-serif (similar to IBM Plex Sans, Inter, or Suisse Int'l)—desktop H1 at 48–72px with tight letter-spacing for impact.
- **Body Text**: Highly legible sans-serif at 16–18px base size, 1.6–1.8 line height, generous paragraph spacing (24–32px between paragraphs).
- **Hierarchy**: Clear visual distinction using weight and size (not just color): H1 (hero) → H2 (section headers) → H3 (card titles) → body copy.

### Imagery & Graphics

- **Photography Style**: Authentic, diverse workplace imagery—avoid generic stock photos. Focus on collaboration scenes, data center environments, and abstract technology visuals.
- **Illustrations**: Minimal usage; when needed, use abstract, line-based, or isometric styles to convey systems, connectivity, and infrastructure.
- **Iconography**: Simple, outlined icons with consistent 2px stroke weight for feature lists, service categories, and navigation elements.

---

## Layout & Structure Specifications

### Hero Section

- **Dimensions**: Full viewport height (100vh) on desktop with slight padding on mobile.
- **Background**: Dark overlay (60–70% opacity) on background video or high-resolution image.
- **Content Layout**: Left-aligned or centered headline, maximum 2–3 lines, with supporting subhead and two CTAs (primary solid button, secondary outline/ghost button).
- **Scroll Cue**: Subtle animated arrow or "scroll" text at bottom to encourage exploration.

### Content Architecture

- **Section Rhythm**: Alternate light and dark full-width sections to create visual rhythm and segment topics (e.g., dark hero → light services → dark case studies → light insights).
- **Card Grids**: Responsive 2–4 column grids for services, articles, and partner logos—cards feature subtle hover lift (4–8px) and shadow increase.
- **Full-Bleed Bands**: Occasional full-width color or image bands with centered text for major announcements or reports.

### Navigation System

- **Header Behavior**: Sticky position, semi-transparent on scroll, solid background on hover—logo left, nav items center/right, primary CTA far right.
- **Desktop Menu**: Mega menu on hover for key sections (Services, Industries, About)—display categorized links with small icons or preview images.
- **Mobile Navigation**: Hamburger menu with accordion-style submenus; all nav items must be large touch targets (minimum 44px height).

### Interaction & Motion Design

#### Micro-interactions

- **Button States**: Smooth color fill or underline animation on hover (200–300ms ease-in-out).
- **Card Hover Effects**: Slight scale-up (1.02–1.05) with shadow increase; contained images zoom subtly within card frame.
- **Scroll Animations**: Fade-in and slide-up (20–40px) for sections as they enter viewport—use Intersection Observer or equivalent.

### Media Handling

- **Background Video**: Muted, looping, abstract tech visuals (data flow, server infrastructure, team collaboration)—heavily compressed for performance (WebM + MP4 fallback).
- **Video Players**: Custom-styled embedded players for podcasts and case studies—match brand colors, hide default controls.

### Content Strategy & UX Patterns

#### Narrative Flow

1. Problem/Opportunity (hero headline addressing business challenge)
2. Solution (services and capabilities overview)
3. Proof (customer success stories, testimonials)
4. Authority (industry recognition, partnerships, certifications)
5. Call to Action (contact, careers, explore services)

#### Trust Indicators

- **Analyst Recognition**: Dedicated section for industry badges (Gartner, IDC, ISG, etc.)—grayscale logos that colorize on hover.
- **Customer Logos**: Scrolling carousel or grid of client logos—consistent sizing, subtle hover effects.
- **Testimonials**: Large italic pull quotes with clear attribution (name, title, company, headshot optional).

### Accessibility Standards

- **Contrast Ratios**: All text must pass WCAG AA minimum (4.5:1 for normal text, 3:1 for large text).
- **Keyboard Navigation**: All interactive elements focusable with visible focus states (2px outline, high contrast).
- **Semantic HTML**: Proper heading hierarchy, ARIA labels on icon buttons, alt text on all images.

### Technical & Performance Requirements

#### Responsive Design

- **Breakpoints**: Mobile-first approach with fluid grids (CSS Grid/Flexbox) and clamp() for responsive typography.
- **Touch Targets**: Minimum 44px for all interactive elements on mobile.

#### Performance Optimization

- **Image Formats**: WebP/AVIF with lazy loading and srcset for resolution switching.
- **Core Web Vitals Targets**:
  - LCP (Largest Contentful Paint): < 2.5s
  - CLS (Cumulative Layout Shift): < 0.1
  - INP (Interaction to Next Paint): < 200ms
- **Loading Strategy**: Code splitting, critical CSS inlining, resource preloading, CDN delivery.

#### Dark Mode Support

- **System Preference**: Respect prefers-color-scheme media query with manual toggle option.
- **Color Inversion**: Thoughtful color mapping (not simple negation)—maintain contrast and brand integrity.

### Deliverables Checklist

- **Style Guide**: Complete color tokens, typography scale, button variants, card templates, form styles.
- **Component Library**: Header, footer, hero, cards, forms, modals, navigation—in Figma with auto-layout and variants.
- **Page Templates**: Home, Services, About, Insights, Contact, Case Studies—with interaction annotations.
- **Motion Specification**: Timing curves (e.g., cubic-bezier(0.4, 0, 0.2, 1)), animation distances, trigger conditions for development handoff.
- **Accessibility Documentation**: Contrast ratio reports, focus order maps, screen reader testing notes, keyboard navigation flows.

### Critical Pitfalls to Avoid

❌ Do NOT:

- Use pure black (#000000) backgrounds—opt for rich charcoal/navy instead.
- Overuse the accent color—reserve for primary actions only.
- Implement complex animations that delay content visibility or hurt performance.
- Use generic stock photography—prioritize authentic, contextual imagery.
- Neglect mobile touch targets or keyboard navigation.
- Create visual clutter—maintain generous whitespace and clear hierarchy.
- Ignore loading states—design skeleton screens and loading indicators for all dynamic content.

✅ DO:

- Test all interactions on real devices (not just emulators).
- Validate color contrast with tools like WebAIM or Stark.
- Optimize all media assets before implementation.
- Document all component states (default, hover, active, focus, disabled).
- Ensure content editors can easily update text and images without breaking layout.

**Design Philosophy**: Balance enterprise credibility with modern digital fluency. Every element should convey trust, innovation, and technical excellence while remaining accessible and performant across all devices and connection speeds.
