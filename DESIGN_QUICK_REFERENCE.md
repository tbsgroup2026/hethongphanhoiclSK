# Mobile App - Design Quick Reference Guide

**Use this guide when building new screens or components.**

---

## 🎯 Three Dials (Always Know These)

| Dial | Value | What It Means |
|------|-------|---------------|
| **DESIGN_VARIANCE** | 6 | Organized but not rigid; breathing room with varied spacing |
| **MOTION_INTENSITY** | 5 | Smooth transitions, spring physics, micro-feedback |
| **VISUAL_DENSITY** | 5 | Practical daily-app density; generous but not wasteful |

---

## 🎨 Color Palette

### Primary Colors
```
Primary Green:     #005A36  (TBS Forest Green - main accent)
Emerald Accent:    #10B981  (success, active, highlights)
```

### Neutral Colors
```
Text (primary):    #0F172A  (Slate-900 - dark gray)
Text (secondary):  #475569  (Slate-600 - medium gray)
Text (muted):      #94A3B8  (Slate-400 - light gray)
Backgrounds:       #FFFFFF  (White - main)
                   #F8FAFC  (Slate-50 - light bg)
Borders:           #E2E8F0  (Slate-200)
```

### Status Colors
```
Success:    #10B981  (Emerald)    → Done status, positive
Warning:    #F59E0B  (Amber)      → In Progress, caution
Error:      #DC2626  (Red)        → Urgent, critical
Info:       #0EA5E9  (Sky Blue)   → Investigating, info
```

**Usage Example:**
```typescript
import { colors } from "@/constants/colors";

<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: colors.white }}>Active</Text>
</View>
```

---

## 📏 Spacing System (4px Base Unit)

| Name | Value | Usage |
|------|-------|-------|
| `xs` | 4px | Micro gaps (between icons/text) |
| `sm` | 8px | Small gaps (form inputs, list items) |
| `md` | 12px | Standard gaps (card padding, list spacing) |
| `lg` | 16px | Large gaps (section padding) |
| `xl` | 24px | Extra large (section margins) |
| `xxl` | 32px | Large sections |
| `xxxl` | 48px | Major sections |

**Usage Example:**
```typescript
import { spacing } from "@/constants/ui-theme";

<View style={{ padding: spacing.lg, gap: spacing.md }}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</View>
```

---

## ⚫ Radius System

| Name | Value | Usage |
|------|-------|-------|
| `sm` | 8px | Input fields, small buttons |
| `md` | 12px | Cards, standard buttons |
| `lg` | 16px | Modals, large containers |
| `full` | 999px | Pill-shaped elements (badges, round buttons) |

**Usage Example:**
```typescript
import { radius } from "@/constants/ui-theme";

<View style={{ borderRadius: radius.md, padding: spacing.lg }}>
  <Text>Card Content</Text>
</View>
```

---

## 🔤 Typography

### Scale Sizes
```
Display:  24px, 28px, 32px (bold, headlines)
Body:     14px, 16px (regular text)
Label:    12px, 14px (UI labels, small text)
Mono:     12px, 14px (data, codes)
```

### Weight Usage
```
700-800:  Headlines, bold labels
600:      Buttons, card titles, emphasis
500:      Body text, secondary labels
400:      Regular body text
```

**Usage Example:**
```typescript
<Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
  Regular Label
</Text>
```

---

## 🎭 Component Patterns

### Button Styles

#### Primary Button (CTA)
```typescript
<TouchableOpacity style={styles.primaryButton}>
  <Text style={styles.primaryButtonText}>Action</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
```

#### Secondary Button (Alternative)
```typescript
<TouchableOpacity style={styles.secondaryButton}>
  <Text style={styles.secondaryButtonText}>Alternative</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
});
```

### Card Pattern
```typescript
<View style={styles.card}>
  <Text style={styles.cardTitle}>Card Title</Text>
  <Text style={styles.cardBody}>Card body text...</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
```

### Badge/Pill Pattern
```typescript
<View style={[styles.badge, { backgroundColor: statusColor }]}>
  <Text style={styles.badgeText}>Status Label</Text>
</View>

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "fit-content",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
});
```

### Input Field Pattern
```typescript
<TextInput
  style={styles.input}
  placeholder="Enter text..."
  placeholderTextColor={colors.textMuted}
/>

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
  },
});
```

---

## ✨ Animation Patterns

### Entrance Animation (FadeInUp)
```typescript
import Animated, { FadeInUp } from "react-native-reanimated";

<Animated.View entering={FadeInUp.delay(100).duration(300)}>
  <Text>Animated content</Text>
</Animated.View>
```

### Staggered List Animation
```typescript
{items.map((item, i) => (
  <Animated.View key={item.id} entering={FadeInUp.delay(i * 50).duration(300)}>
    <IssueCard {...item} />
  </Animated.View>
))}
```

### Tab Icon Animation (Spring)
```typescript
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";

const scale = useSharedValue(1);

useEffect(() => {
  scale.value = withSpring(focused ? 1.08 : 0.9, {
    friction: 7,
    tension: 100,
  });
}, [focused]);

<Animated.View style={[{ transform: [{ scale }] }]}>
  <Icon />
</Animated.View>
```

---

## 🔍 Common Patterns to Avoid

❌ **Don't:**
- Use emoji in UI elements (only for placeholder, not production)
- Mix different accent colors in the same section
- Create touch targets smaller than 44px
- Stack cards 3+ levels deep
- Use different spacing systems in the same component
- Apply shadows to everything (use borders instead)
- Forget about safe area insets (iOS notch, Android nav bar)

✅ **Do:**
- Use spacing constants consistently
- Apply radius from the radius system
- Color-code semantically (green=success, red=error, etc.)
- Test on real devices
- Provide visual feedback on interactions
- Group related spacing with `gap` property
- Use system icons from expo-symbols

---

## 📱 Safe Area Handling

```typescript
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* Content */}
    </View>
  );
}
```

---

## 🎭 Icon Usage (expo-symbols)

```typescript
import { SymbolView } from "expo-symbols";

<SymbolView
  name="house.fill"
  size={24}
  tintColor={colors.primary}
/>
```

**Common Icons:**
- `house.fill` - Home
- `bell.fill` - Notifications
- `wrench.fill` - Work/Settings
- `person.fill` - Profile/User
- `checkmark.circle.fill` - Success
- `exclamationmark.triangle.fill` - Warning
- `xmark.circle.fill` - Error
- `info.circle.fill` - Info
- `magnifyingglass` - Search
- `plus.circle.fill` - Add

---

## 🧪 Testing Checklist

Before shipping a component:

- [ ] Text is readable (4.5:1 contrast minimum)
- [ ] Touch targets are ≥44px
- [ ] All colors come from constants
- [ ] All spacing uses spacing system
- [ ] All radii use radius system
- [ ] Animations are smooth (60 FPS)
- [ ] Works on iOS (safe areas, notch)
- [ ] Works on Android (back gesture, navigation)
- [ ] Dark mode compatible
- [ ] No hardcoded colors/spacing
- [ ] Load states included
- [ ] Error states included
- [ ] Animations respect prefers-reduced-motion

---

## 📚 File References

| File | Purpose |
|------|---------|
| `src/constants/colors.ts` | Color palette |
| `src/constants/ui-theme.ts` | Spacing, radius, typography |
| `src/components/issue-card.tsx` | Reference component |
| `src/app/login.tsx` | Login reference |
| `src/app/(tabs)/index.tsx` | Home screen reference |
| `DESIGN_TASTE.md` | Full design guide |
| `TASTE_IMPROVEMENT.md` | Detailed improvements |
| `CHANGES_SUMMARY.md` | Visual before/after |

---

## 🚀 Quick Commands

```bash
# Check lint (includes styling)
npm run lint

# Run app locally
npm run start
# Then press 'i' for iOS or 'a' for Android

# Build for iOS
npm run ios

# Build for Android
npm run android

# Web preview
npm run web
```

---

## 🎓 Key Takeaway

Every design decision serves a purpose:
- **Colors** define status and meaning
- **Spacing** creates rhythm and emphasis
- **Radii** create visual warmth
- **Motion** provides feedback
- **Icons** communicate instantly
- **Typography** establishes hierarchy

**Design Direction: Human. Simple. Elegant. Modern. ✨**

