# Mobile App - Premium Redesign (Design Taste Skill)

## Design Read
**Reading this as:** Expo React Native app for factory quality control workers (QA, maintenance, line leaders), with functional but dated design (emoji tabs, basic forms, limited hierarchy). Target audience: industrial/manufacturing professionals who need speed + clarity + elegance. Need: modern, human-centered, premium-feeling redesign that maintains industrial trust while adding visual sophistication.

---

## Core Configuration

### Dial Values
- **DESIGN_VARIANCE: 6** - organized but not rigid (card layouts with breathing room, varied spacing, offset compositions)
- **MOTION_INTENSITY: 5** - smooth transitions, spring physics on tab changes, micro-feedback on interactions, no heavy animations
- **VISUAL_DENSITY: 5** - practical daily-app density with generous breathing room

### Platform Mode
- **Cross-platform premium neutral** - respects safe areas, works cleanly on iOS and Android, uses universal mobile patterns

---

## Visual Direction

### Color Palette (Refined from current TBS Green)
- **Primary Accent:** `#005A36` (TBS Forest Green) - keep, but use more sparingly and refinedly
- **Primary Light:** `#10B981` (Emerald) - new lighter accent for positive/success states
- **Neutrals:** 
  - Text: `#0F172A` (Slate-900)
  - Text Secondary: `#475569` (Slate-600)
  - Text Muted: `#94A3B8` (Slate-400)
  - Surfaces: `#FFFFFF` (white)
  - Surface Secondary: `#F8FAFC` (Slate-50)
  - Borders: `#E2E8F0` (Slate-200)
- **Status Colors:**
  - Success: `#10B981` (Emerald)
  - Warning: `#F59E0B` (Amber)
  - Error: `#DC2626` (Red)
  - Info: `#0EA5E9` (Sky Blue)

### Typography
- **Display/Headlines:** Geist (or system `system` font) - bold, `text-3xl` to `text-4xl`
- **Body/UI:** System font (clean sans-serif) - `text-base` for body, `text-sm` for secondary
- **Accents:** weight 600-700 for emphasis
- **Mono:** For data/codes/serial numbers

### Spacing System
- Use multiples of 4px (4, 8, 12, 16, 24, 32, 48)
- Section padding: `32px` (generous)
- Card padding: `16-20px`
- Gap between items: `12px` for lists, `16px` for sections

### Corner Radii
- **Buttons & Small Elements:** `8px`
- **Cards & Containers:** `12px`
- **Large Modals/Sheets:** `16px` top, `0` for bottom-sheet behavior
- **Inputs:** `8px`

### Shadow System
- **No shadows by default** - prefer clean borders and spacing
- **Card elevation:** Optional very subtle shadow `0 1px 3px rgba(0,0,0,0.05)`
- **Modals/Sheets:** Only when needed, soft shadow

### Key Design Moves
1. **Tab Bar Redesign** - Replace emoji tabs with clean icon + label system, spring-based active state, bottom-safe-area aware
2. **Card-Based List** - Replace raw list with refined cards with gentle borders, hover effect
3. **Hero Metric Cards** - Large, bold metric displays for issue counts/status
4. **Form Refinement** - Cleaner inputs, better label hierarchy, better error states
5. **Status Badges** - Colored pills with refined typography
6. **Image Treatment** - Controlled frames, gentle fades where text overlays images
7. **Empty States** - Memorable, helpful empty UI (not just blank)
8. **Loading States** - Skeletal loaders matching actual layout shape (not generic spinners)

---

## Component Language

### Button Family
- **Primary CTA:** Solid green background, white text, 12px radius, spring press
- **Secondary:** Outline style, forest green border/text
- **Tertiary:** Text-only, subtle hover
- **Danger:** Solid red background for destructive actions

### Card Module
- White background or soft slate surface
- 12px radius
- 16-20px internal padding
- 1px border `#E2E8F0` or no border with subtle shadow
- Clean left/right hierarchy (avatar/image on left, content on right)

### Input Fields
- White background, 8px radius
- 12px top/bottom padding, 16px left/right
- Focus: Green accent border `#005A36`, no loud shadow
- Placeholder: Slate-400
- Helper text: Slate-500, 12px

### Status Badge (Pill)
- Solid background (status color variant)
- 16px padding left/right, 8px top/bottom
- 999px radius (full pill)
- 12px bold label
- Color mapping: Reported (amber), Investigating (blue), In Progress (amber), Done (green)

### Tab Bar
- Clean icons (not emoji)
- Active: Green accent + slight scale-up (spring animation)
- Inactive: Slate-400
- Labels below icons, 10px font
- 64px height total, respects bottom safe area

---

## Screens to Redesign (Priority)

1. **Login Screen** - Modern auth with cleaner form
2. **Home (Issues List)** - Card-based list with better status visibility
3. **Create Issue Form** - Refined form UX with better field grouping
4. **Profile Screen** - Cleaner profile info display
5. **Tab Bar** - New icon-based navigation

---

## Key UX Improvements

### Hierarchy & Clarity
- Issues sorted by status/urgency (visual + data)
- Clear button labels (not just icons)
- Better empty states
- Loading states match final layout

### Micro-Interactions
- Tab change: Spring bounce (friction 6)
- Card tap: Subtle scale-down (0.98x) + opacity fade
- Button press: Spring scale (0.95x)
- Form validation: Smooth red border with shake (light)

### Touch Targets
- Minimum 44px height for buttons/taps
- Cards have 12px vertical spacing between

### Readability
- Type sizes: 16px base body, 14px secondary, 24px+ for headlines
- Line height: 1.5-1.6 for body
- Max width per line: natural for mobile (full width)
- High contrast: Dark text on light backgrounds (4.5:1+ WCAG AA)

---

## Anti-Patterns to Avoid
- No emoji tabs (replace with clean icons)
- No nested card stacks (max 2 levels of framing)
- No tiny unreadable text
- No pure gradients or glass effects without purpose
- No "Acme Co" filler text (use real demo data)
- No fake chart spam
- No over-animation

---

## Motion Principles

All motion should answer: "What does this communicate?"

Valid moves:
- Tab switch: Spring bounce (shows selection, playful energy)
- List load: Staggered fade-in (draw attention, shows data arrival)
- Card tap: Soft scale feedback (tactile click confirmation)
- Form error: Border highlight + light shake (attention to problem)
- Loader: Skeletal placeholder pulse (not generic spinner)

---

## Next Phase
Convert this visual direction into React Native components, update screens, refine spacing/colors in code.
