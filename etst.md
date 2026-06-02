# Design System Inspired by NextSense

## 1. Visual Theme & Atmosphere

NextSense presents a sophisticated, science-driven aesthetic that bridges clinical credibility with accessible wellness. The design embraces a dark-to-light spectrum anchored by deep navy and charcoal tones, complemented by soft lavender and cool blues that evoke calm, focus, and neural connectivity. The visual language is elegant yet grounded, using generous whitespace, refined typography, and subtle gradients to communicate innovation in sleep science. Product imagery dominates key hero sections, elevated against minimal backgrounds to emphasize the premium nature of the technology. The overall mood is serene, intelligent, and aspirational—designed to inspire confidence in a transformative health solution.

**Key Characteristics**
- Dark sophisticated palette with lavender accents suggesting neuroscience and wellness
- Instrument Serif headlines convey timeless authority and editorial prestige
- Generous whitespace and breathing room between content blocks
- Premium product photography as visual anchor rather than graphic decoration
- High contrast text hierarchies that guide user attention through scientific messaging
- Rounded button treatments balance precision with approachability
- Subtle shadows and elevation create depth without visual clutter
- Cool color temperature throughout reinforces sleep, calm, and recovery themes

## 2. Color Palette & Roles

### Primary
- **Deep Navy** (`#1F2438`): Primary background and dominant structural color; used for dark hero sections and primary brand surfaces
- **Navy Black** (`#171C2F`): Deepest neutral; text on light backgrounds and foundational page structure
- **Core Dark** (`#2B2E3F`): Secondary brand color; used for secondary backgrounds, accents, and component fills

### Accent Colors
- **Lavender Blue** (`#7F9EF8`): Primary accent and interactive highlight; CTA elements, links, and brand emphasis
- **Soft Lavender** (`#AAA8FF`): Secondary accent for subtle brand signals and supporting visual elements
- **Deep Purple** (`#4A48A8`): Tertiary accent for depth and layered visual hierarchy

### Interactive
- **Lavender Blue** (`#7F9EF8`): Primary button states, link hover effects, and focus indicators
- **Deep Navy** (`#1F2438`): Secondary button fills and persistent interactive surfaces
- **Pale Blue** (`#F7F6FC`): Interactive surface background for accessibility and button overlays

### Neutral Scale
- **Off-White** (`#FAFAF7`): Warm white for minimal page backgrounds and light card surfaces
- **Pure White** (`#FFFFFF`): Primary content background; cards, modals, and container fills
- **Light Gray** (`#EFEFEF`): Secondary neutral for borders and subtle dividers
- **Medium Gray** (`#DEDEDE`): Tertiary neutral for form borders and disabled states

### Surface & Borders
- **Light Lavender** (`#F7F6FC`): Light surface background for contrast sections
- **Warm Off-White** (`#FAFAF7`): Default page background
- **Soft Border** (`#DEDEDE`): Form input and card borders

### Semantic / Status
- **Warning Yellow** (`#FFFBA5`): Warning and promotional highlights; used sparingly for attention-grabbing elements
- **Warning Amber** (`#FFC83D`): Primary warning state; status alerts and secondary promotional signals
- **Success Green** (`#1FA84A`): Positive confirmation and success states
- **Success Bright Green** (`#3ED660`): Secondary success state for high-contrast confirmations
- **Error Red** (`#D84516`): Error states and critical warnings

## 3. Typography Rules

### Font Family
**Primary Display & Headlines:** Instrument Serif (serif stack: Georgia, serif). Used for h1 and h2 to convey editorial authority and timeless prestige.

**Secondary Headings & Labels:** DM Sans (sans-serif stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif). Modern and legible for product messaging and interface labels.

**Body & Interface:** Miletus Grotesk (sans-serif stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif). Balanced geometric proportions for body copy and navigation.

**Fallback for Buttons:** Arial (sans-serif stack: Arial, Helvetica, sans-serif). System-safe for interactive elements.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display (h1) | Instrument Serif | 84px | 400 | 88.2px | 0px | Hero headlines; maximum visual impact |
| Large Heading (h2) | Instrument Serif | 68px | 400 | 71.4px | 0px | Section introductions; editorial tone |
| Subheading (h3) | DM Sans | 17.6px | 700 | 22px | 0px | Product callouts and category labels |
| Label (h4) | Miletus Grotesk | 16px | 400 | 20.8px | 0px | Form labels and small headers |
| Body | Miletus Grotesk | 14.08px | 500 | 21.12px | 0px | Primary body copy and description text |
| Emphasis (span) | DM Sans | 16px | 500 | 20.8px | 0px | Highlighted text within body; pricing or features |
| Label / Form | Helvetica | 16px | 700 | normal | 0px | Form field labels |
| Input / Form Value | DM Sans | 16px | 600 | normal | 0px | Placeholder and input text |
| Button | Arial | 13.3333px | 400 | normal | 0px | CTA and interactive button text |

### Principles
- Serif headlines establish authority and aspirational tone; limit to h1 and h2 only
- Sans-serif body copy ensures legibility and modern product feel across all devices
- Weight contrast (400 vs. 600–700) guides visual hierarchy without excessive color changes
- Line heights are generous (1.05–1.5x font size) to improve readability and breathing room
- Button text remains compact (13px) to maintain visual compactness while action-oriented emphasis resides in color and shape
- Limit font sizes to the defined palette; no arbitrary sizing

## 4. Component Stylings

### Buttons

**Primary Button (Dark Navy with Rounded Corners)**
- Background: `#1F2438`
- Text Color: `#FFFFFF`
- Font: Arial, 13.3333px, weight 400
- Padding: `12px 32px`
- Border Radius: `100px`
- Border: none
- Box Shadow: none
- Height: auto
- Hover State: Background `#0F1419` (darker navy)
- Active State: Background `#0A0D15` (near-black)
- Focus State: `outline: 2px solid #7F9EF8; outline-offset: 2px`

**Secondary Button (White with Navy Border)**
- Background: `#FFFFFF`
- Text Color: `#1F2438`
- Font: Arial, 13.3333px, weight 400
- Padding: `12px 32px`
- Border Radius: `100px`
- Border: `1px solid #1F2438`
- Box Shadow: none
- Height: auto
- Hover State: Background `#F7F6FC`; Border `1px solid #2B2E3F`
- Active State: Background `#EFEFEF`

**Ghost Button (Transparent with Text)**
- Background: transparent
- Text Color: `#2B2E3F`
- Font: Arial, 13.3333px, weight 400
- Padding: `8px 8px`
- Border Radius: `0px`
- Border: none
- Box Shadow: none
- Height: auto
- Hover State: Text Color `#7F9EF8`; Text Decoration underline
- Active State: Text Color `#4A48A8`

**Icon Button (Circular, Minimal)**
- Background: transparent
- Text Color: `#2B2E3F`
- Font: Miletus Grotesk, 16px, weight 400
- Padding: `0px`
- Border Radius: `50%`
- Border: none
- Width: `44px`
- Height: `44px`
- Box Shadow: none
- Hover State: Background `rgba(43, 46, 63, 0.06)`
- Active State: Background `rgba(43, 46, 63, 0.12)`

**Promotional Badge Button (Soft Fill)**
- Background: `rgba(43, 46, 63, 0.06)`
- Text Color: `#000000`
- Font: Arial, 13.3333px, weight 400
- Padding: `0px`
- Border Radius: `50%`
- Border: `1px solid rgba(43, 46, 63, 0.08)`
- Width: `36px`
- Height: `36px`
- Box Shadow: none
- Hover State: Background `rgba(43, 46, 63, 0.12)`

### Cards & Containers

**Product Card (White Background)**
- Background: `#FFFFFF`
- Text Color: `rgba(0, 0, 0, 0.81)`
- Font: Miletus Grotesk, 16px, weight 400
- Padding: `0px` (padding applied to inner content)
- Border Radius: `0px` (or `12px` for modern variant)
- Border: none
- Box Shadow: `rgba(43, 46, 63, 0.06) 0px 2px 20px 0px`
- Line Height: normal

**Modal / Elevated Card**
- Background: `#FFFFFF`
- Text Color: `rgba(0, 0, 0, 0.81)`
- Padding: `48px`
- Border Radius: `12px`
- Border: none
- Box Shadow: `rgba(0, 0, 0, 0.15) 0px 5px 30px 0px`
- Line Height: normal

**Feature Section (Minimal Card)**
- Background: transparent (or `#FAFAF7` for alternating sections)
- Text Color: `rgba(0, 0, 0, 0.81)`
- Padding: `64px 0px`
- Border Radius: `0px`
- Border: none
- Box Shadow: none

### Inputs & Forms

**Text Input (Light Background)**
- Background: `#FFFFFF`
- Text Color: `#171C2F`
- Font: DM Sans, 16px, weight 600
- Padding: `0px 14px`
- Border Radius: `9px`
- Border: `1px solid rgba(23, 28, 47, 0.18)`
- Height: `42px`
- Box Shadow: none
- Focus State: Border `1px solid #7F9EF8`; Box Shadow `0px 0px 0px 3px rgba(127, 158, 248, 0.1)`
- Placeholder Color: `rgba(23, 28, 47, 0.5)`

**Text Input Underline (Email Signup)**
- Background: transparent
- Text Color: `#7F9EF8`
- Font: Helvetica, 16px, weight 400
- Padding: `0px 0px 0px 16px`
- Border Radius: `0px`
- Border: none (underline effect via border-bottom: `1px solid #7F9EF8`)
- Height: `54px`
- Box Shadow: none
- Focus State: Border-bottom `2px solid #7F9EF8`

**Checkbox / Select Input**
- Background: `#FFFFFF`
- Text Color: `#000000`
- Font: Arial, 16px, weight 400
- Padding: `11.2px 0px`
- Border Radius: `4px`
- Border: `2px inset #767676`
- Box Shadow: none
- Checked State: Background `#7F9EF8`; Border `2px inset #4A48A8`

### Navigation

**Header Navigation Link**
- Background: transparent
- Text Color: `#2B2E3F`
- Font: DM Sans, 19.2px, weight 500
- Padding: `8px 0px`
- Border Radius: `0px`
- Border: none
- Height: `35.2031px`
- Line Height: `19.2px`
- Hover State: Text Color `#7F9EF8`; Border-bottom `2px solid #7F9EF8`
- Active State: Text Color `#7F9EF8`; Border-bottom `2px solid #7F9EF8`

**Navigation Container**
- Background: transparent (or `#FFFFFF` for sticky header)
- Text Color: `rgba(0, 0, 0, 0.81)`
- Font: Miletus Grotesk, 16px, weight 400
- Padding: `16px 0px`
- Border Radius: `0px`
- Border: none (or `1px solid #DEDEDE` on bottom for sticky variant)
- Box Shadow: `rgba(43, 46, 63, 0.06) 0px 2px 20px 0px` (sticky variant only)
- Height: `35.2031px`

### Badges

**Status Badge (Category Label)**
- Background: `#F7F6FC`
- Text Color: `#2B2E3F`
- Font: DM Sans, 12px, weight 700
- Padding: `6px 12px`
- Border Radius: `50px`
- Border: none
- Box Shadow: none

**Warning Badge**
- Background: `#FFFBA5`
- Text Color: `#2B2E3F`
- Font: DM Sans, 12px, weight 700
- Padding: `6px 12px`
- Border Radius: `50px`
- Border: none

**Success Badge**
- Background: `#3ED660`
- Text Color: `#FFFFFF`
- Font: DM Sans, 12px, weight 700
- Padding: `6px 12px`
- Border Radius: `50px`
- Border: none

## 5. Layout Principles

### Spacing System
- **Base Unit:** `8px`
- **Scale:** 4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 36px, 40px, 48px, 64px
- **Usage Context:**
  - **4–8px:** Tight micro-interactions; icon padding; minimal gaps
  - **12–16px:** Input padding; small button padding; list item spacing
  - **20–24px:** Component internal padding; button padding (horizontal)
  - **28–32px:** Section padding (inline); container breathing room
  - **40–48px:** Major section padding; content block separation
  - **64px:** Full section margin; hero-to-content transitions; maximum breathing room

### Grid & Container
- **Max Width:** `1425px` (observed from card width data; adjust to `1200px` or `1280px` for standard implementations)
- **Column Strategy:** 12-column grid with flexible gutters (`24px` to `32px` depending on viewport)
- **Section Patterns:** Full-bleed dark sections (navy `#1F2438`) alternate with white (`#FFFFFF`) or light lavender (`#F7F6FC`) sections
- **Content Alignment:** Left-aligned body text with generous right margin on narrow viewports; centered hero headlines

### Whitespace Philosophy
NextSense embraces asymmetrical, generous whitespace to convey premium positioning and reduce cognitive load. Rather than packed layouts, content floats with substantial breathing room—particularly around hero imagery and call-to-action buttons. Vertical rhythm is maintained through consistent margin multiples (`16px`, `32px`, `64px`) to create visual harmony. Whitespace is active: it guides the eye, separates concerns, and signals that the product is not cluttered but carefully considered.

### Border Radius Scale
- **0px:** Navigation bars, section dividers, and flat layout elements
- **4px:** Form inputs and minimal UI controls
- **9px:** Input fields (specific variant with stronger definition)
- **12px:** Card corners and elevated containers (inferred for modern card treatment)
- **30px:** Button treatment (less common; intermediate radius option)
- **50px:** Badge pills and category labels
- **50% (100px):** Fully rounded buttons and circular icon buttons; primary CTA treatment

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat (L0) | No shadow; `box-shadow: none` | Structural backgrounds; navigation; section dividers |
| Subtle (L1) | `rgba(43, 46, 63, 0.06) 0px 2px 20px 0px` | Card surfaces; navigation header on scroll; modest elevation |
| Elevated (L2) | `rgba(0, 0, 0, 0.15) 0px 5px 30px 0px` | Modals; floating cards; dropdowns; maximum depth |

**Shadow Philosophy:**
NextSense uses a minimal shadow approach that prioritizes subtlety and refinement. Shadows are designed to suggest depth without creating visual distraction. The primary shadow (`rgba(43, 46, 63, 0.06) 0px 2px 20px 0px`) is soft and diffuse, appropriate for cards and modest elevation. The secondary shadow (`rgba(0, 0, 0, 0.15) 0px 5px 30px 0px`) is reserved for modal overlays and significant elevation, creating clear layering. Both shadows use offset blur (20–30px) to suggest distant light sources and maintain the serene aesthetic. Avoid harsh, dark shadows that would conflict with the calm, sophisticated mood.

## 7. Do's and Don'ts

### Do
- Use Instrument Serif exclusively for h1 and h2 headlines to maintain editorial authority
- Apply `#7F9EF8` lavender blue to all primary interactive elements (buttons, links, focus states)
- Maintain minimum `16px` padding around interactive elements for comfortable touch targets
- Pair dark navy sections (`#1F2438`) with white text for maximum contrast and readability
- Use `100px` or `50%` border radius for all primary CTAs to signal modern accessibility
- Combine generous vertical spacing (`64px` margins) with generous horizontal padding for breathing room
- Apply subtle box shadows (`0px 2px 20px 0px rgba(43, 46, 63, 0.06)`) to cards for gentle elevation
- Use `#FAFAF7` light background as an alternative to pure white for subtle visual rest
- Include at least `8px` internal padding on all buttons; favor larger padding (`12px` to `16px`) for primary actions
- Test color contrast ratios to ensure all text meets WCAG AA standards (minimum 4.5:1 for body text)

### Don't
- Mix serif fonts outside of h1/h2 headlines; serif in body copy disrupts modern product feel
- Apply `#7F9EF8` or other accent colors to structural elements; reserve accents for interactive states only
- Use border-radius below `4px` for input fields (insufficient visual definition)
- Stack buttons without at least `12px` vertical spacing; ensure clear visual separation
- Use dark shadows on dark backgrounds; always pair elevation shadows with light surfaces
- Crowding form labels and inputs; maintain minimum `20px` vertical spacing between form groups
- Applying multiple competing shadows to a single element (one shadow per level only)
- Using warm colors or yellows for non-warning states; yellow is reserved for `#FFC83D` warning signals
- Reducing padding below `8px` on any interactive element; touch targets must remain comfortable
- Creating text color contrast below 4.5:1 for body copy or links; accessibility is non-negotiable

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | 320px–599px | Single-column layout; full-width cards (padding `16px`); button width 100%; font sizes reduced 10–15%; navigation collapses to hamburger menu |
| Tablet | 600px–1023px | Two-column grid; inline navigation bar; padding `24px`–`32px`; buttons remain `100%` or `48%` width in groups |
| Desktop | 1024px–1425px | Multi-column grid (12-column); max-width `1425px`; inline buttons with flex layout; full-size typography; padding `40px`–`64px` |
| Large Desktop | 1426px+ | Max-width constraint to `1425px`; centered content; extended margins on sides |

### Touch Targets
- **Minimum Height:** `44px` for all interactive elements (buttons, inputs, navigation links)
- **Minimum Width:** `44px` for icon buttons; `100px` for text buttons
- **Padding Around Touch Targets:** `8px` minimum; `12px` preferred on mobile for comfortable spacing
- **Spacing Between Adjacent Buttons:** `12px` minimum to prevent mis-taps

### Collapsing Strategy
- **Navigation:** Desktop horizontal nav collapses to hamburger menu icon (44px square) at tablet breakpoint; menu items stack vertically in full-height slide-out or dropdown
- **Hero Sections:** h1 font size reduces from `84px` to `56px` on tablet, `40px` on mobile; h2 reduces from `68px` to `48px` tablet, `32px` mobile
- **Layouts:** Content blocks transition from side-by-side (desktop) to stacked (mobile); image and text sections reorder for mobile-first readability
- **Buttons:** Full-width on mobile (`width: 100%; padding: 12px 16px`); grouped buttons stack vertically or reduce to `48%` width in pairs on tablet
- **Padding:** `64px` section margins reduce to `40px` on tablet, `24px` on mobile; internal component padding reduces proportionally (12px → 8px on mobile)
- **Typography:** Body text remains `14.08px` minimum; input font size stays `16px` to prevent iOS auto-zoom; label font maintains `14px–16px` on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA & Interactive:** Lavender Blue (`#7F9EF8`) for hover, focus, and primary action states
- **Primary Button Fill:** Deep Navy (`#1F2438`) for solid button backgrounds
- **Primary Background:** Core Dark (`#2B2E3F`) for dark hero sections; Pure White (`#FFFFFF`) for content areas
- **Heading Text:** Navy Black (`#171C2F`) for high contrast on light backgrounds; Pure White (`#FFFFFF`) on dark backgrounds
- **Body Text:** Core Dark (`#2B2E3F`) or Navy Black (`#171C2F`) for 81% opacity text on white
- **Borders & Dividers:** Medium Gray (`#DEDEDE`) for subtle divisions; Light Gray (`#EFEFEF`) for minimal visible borders
- **Warning / Alert:** Warning Amber (`#FFC83D`) for warning badges; Error Red (`#D84516`) for critical errors
- **Success / Confirmation:** Success Green (`#3ED660`) for positive states
- **Neutral Surface:** Off-White (`#FAFAF7`) for alternating section backgrounds; maintains warmth while reducing fatigue

### Iteration Guide

1. **Establish Foundation Colors:** Always use `#1F2438` for primary dark surfaces, `#FFFFFF` for light content areas, and `#7F9EF8` for all interactive states (buttons, links, focus outlines). These three colors form the backbone; all others are secondary.

2. **Typography Hierarchy First:** Apply Instrument Serif (`84px` h1, `68px` h2) only to display and large section headers. All other text uses DM Sans or Miletus Grotesk. Button text is Arial `13.3333px`. This ensures the serif conveys prestige without overwhelming the interface.

3. **Button Treatment:** Every primary CTA must have `border-radius: 100px`, `padding: 12px 32px`, and `background: #1F2438` with `color: #FFFFFF`. Hover state is `#0F1419`. Secondary buttons use `#FFFFFF` background with `border: 1px solid #1F2438`. Ghost buttons are transparent with `color: #2B2E3F`.

4. **Spacing & Rhythm:** Use the spacing scale consistently: `16px` for component padding, `24px` for section spacing, `40px–64px` for vertical section margins. Never arbitrary values; always snap to the scale.

5. **Shadows & Depth:** Apply `rgba(43, 46, 63, 0.06) 0px 2px 20px 0px` to cards and modest containers. Reserve `rgba(0, 0, 0, 0.15) 0px 5px 30px 0px` for modals only. Avoid stacking multiple shadows; elevation is binary (flat or elevated).

6. **Form Inputs:** All text inputs use `border-radius: 9px`, `border: 1px solid rgba(23, 28, 47, 0.18)`, `padding: 0px 14px`, `height: 42px`, and `background: #FFFFFF`. Focus state adds `box-shadow: 0px 0px 0px 3px rgba(127, 158, 248, 0.1)` with border color `#7F9EF8`.

7. **Navigation:** Header links are DM Sans `19.2px` weight 500, `color: #2B2E3F`. Hover state changes text to `#7F9EF8` with `border-bottom: 2px solid #7F9EF8`. Maintain minimum `8px` padding around nav items for comfortable clicking.

8. **Responsive Collapse:** At `600px` breakpoint, reduce h1 from `84px` to `56px` and all padding/margins by 10–15%. At `1024px+`, return to full desktop padding and typography. Navigation becomes hamburger menu below `1024px`.

9. **Accessibility Compliance:** Ensure all text (body, buttons, labels) maintains minimum 4.5:1 contrast ratio. Input placeholders should not fall below 3:1. Focus outlines are always visible (outline: 2px solid #7F9EF8; outline-offset: 2px). Touch targets are minimum 44px height.

10. **Brand Consistency Check:** Before finalizing any component, verify it uses only colors from the palette, typography from the defined hierarchy, spacing from the scale, and shadows from the elevation guide. If not listed here, it should not appear in the design.