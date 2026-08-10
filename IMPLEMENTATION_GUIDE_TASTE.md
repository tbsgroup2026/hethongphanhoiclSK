# Mobile App - Taste Skill Implementation Guide

**Complete guide for developers implementing the redesign.**

---

## 🎯 What Was Redesigned?

Three major screens were redesigned to follow **Taste Skill** principles:

1. ✅ **Login Screen** - Modern auth, clean role selection
2. ✅ **Home Screen** - Card-based issue list, clear status visibility
3. ✅ **Tab Bar** - System icons with spring physics

---

## 📦 What Changed (Technical)

### Files Modified

#### 1. `src/app/login.tsx` ✅
**Status:** Updated with new design

Changes:
- Demo accounts reduced from 8 to 5 (better focus)
- Added description text to each role
- Implemented FadeInUp entry animations
- Used spacing constants throughout
- Improved error display styling
- Added role indicator dot (changes color on active)

Import additions:
```typescript
import Animated, { FadeInUp } from "react-native-reanimated";
import { spacing, radius } from "@/constants/ui-theme";
import { PressableScale } from "@/components/pressable-scale";
```

#### 2. `src/app/(tabs)/_layout.tsx` ✅
**Status:** Updated with system icons

Changes:
- Replaced emoji with expo-symbols
- Added SymbolView import
- Updated icon names to system icons (house.fill, bell.fill, etc.)
- Improved tab bar styling
- Added proper scaling animation

Import additions:
```typescript
import { SymbolView } from "expo-symbols";
```

#### 3. `src/app/(tabs)/index.tsx` ✅
**Status:** Replaced with home-redesign.tsx

Changes:
- Now uses IssueCard component for each issue
- Better visual hierarchy
- Status badges color-coded
- Severity indicators visible
- Time-ago formatting
- Staggered animations on load

No new imports needed (already uses required components).

### Files Unchanged (But Improved By)

#### `src/components/issue-card.tsx`
**Status:** No changes needed (already follows Taste Skill)

This component was already well-designed and provides:
- Proper spacing system usage
- Color-mapped status/severity
- Animated entry
- Clean card structure

#### `src/constants/colors.ts`
**Status:** Colors already defined (uses them now)

Provides:
- Primary and accent colors
- Status color mappings
- Semantic color naming
- WCAG AA contrast

#### `src/constants/ui-theme.ts`
**Status:** System already defined (uses it now)

Provides:
- Spacing system (xs through xxxl)
- Radius system (sm, md, lg, full)
- Typography scales

---

## 🔄 How to Update Other Screens

### Profile Screen Example

```typescript
// src/app/(tabs)/profile.tsx

import { spacing, radius } from "@/constants/ui-theme";
import { colors } from "@/constants/colors";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with user info */}
      <Animated.View entering={FadeInUp.duration(300)}>
        <View style={styles.userCard}>
          {/* Avatar */}
          {/* Name */}
          {/* Role */}
        </View>
      </Animated.View>

      {/* Profile sections */}
      <ScrollView style={styles.content}>
        {/* Each section: card pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.card}>
            {/* Content */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  userCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    gap: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
```

### Generic Card Component

```typescript
// Use this pattern for any card:

<View style={styles.card}>
  {/* Header */}
  <View style={styles.cardHeader}>
    <Text style={styles.cardTitle}>Title</Text>
  </View>

  {/* Divider */}
  <View style={styles.divider} />

  {/* Body */}
  <Text style={styles.cardBody}>Content here</Text>

  {/* Footer with action */}
  <TouchableOpacity style={styles.cardAction}>
    <Text style={styles.cardActionText}>Action</Text>
  </TouchableOpacity>
</View>

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardAction: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cardActionText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 13,
  },
});
```

---

## 🎨 Color Usage Guide

### Semantic Color Mapping

```typescript
// Status indicators
colors.primary           // Primary actions, active states
colors.primaryLight      // Success, positive states
colors.warning           // In progress, caution
colors.error             // Errors, urgent
colors.info              // Information, investigating

// Text levels
colors.text              // Main text (headlines, important)
colors.textSecondary     // Secondary text (metadata)
colors.textMuted         // Disabled, hints

// Surfaces
colors.background        // Main surface
colors.backgroundSecondary // Light backgrounds, disabled states
colors.border            // 1px dividers
```

### Example: Status Badge

```typescript
const statusColors = {
  REPORTED: { bg: colors.warning, text: colors.white },
  INVESTIGATING: { bg: colors.info, text: colors.white },
  IN_PROGRESS: { bg: colors.warning, text: colors.white },
  DONE: { bg: colors.success, text: colors.white },
};

<View style={[styles.badge, { backgroundColor: statusColors[status].bg }]}>
  <Text style={[styles.badgeText, { color: statusColors[status].text }]}>
    {status}
  </Text>
</View>
```

---

## 📏 Spacing Usage Guide

### Common Patterns

```typescript
// Form with inputs
<View style={{ gap: spacing.md }}>
  <TextInput style={{ padding: spacing.md }} />
  <TextInput style={{ padding: spacing.md }} />
</View>

// Card with sections
<View style={{
  padding: spacing.lg,
  gap: spacing.md,
}}>
  <Text>Header</Text>
  <Divider />
  <Text>Body</Text>
</View>

// List of items
<FlatList
  data={items}
  contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}
/>

// Hero section
<View style={{
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
}}>
  <Text style={{ marginBottom: spacing.lg }}>Headline</Text>
  <Text>Subtitle</Text>
</View>
```

---

## ✨ Animation Usage Guide

### Entry Animations

```typescript
import Animated, { FadeInUp, FadeInDown, FadeIn } from "react-native-reanimated";

// Fade up from below (list items)
<Animated.View entering={FadeInUp.delay(index * 50)}>
  <Item />
</Animated.View>

// Fade in from top (header)
<Animated.View entering={FadeInDown.duration(400)}>
  <Header />
</Animated.View>

// Simple fade (background)
<Animated.View entering={FadeIn.duration(300)}>
  <Background />
</Animated.View>
```

### Spring Physics

```typescript
import Animated, { withSpring } from "react-native-reanimated";

const scale = useSharedValue(1);

// Spring animation on interaction
useEffect(() => {
  scale.value = withSpring(isActive ? 1.1 : 1, {
    friction: 7,
    tension: 100,
  });
}, [isActive]);

<Animated.View style={[{ transform: [{ scale }] }]}>
  <TouchableOpacity onPress={() => setActive(!isActive)}>
    <Text>Tap me</Text>
  </TouchableOpacity>
</Animated.View>
```

---

## 🧪 Testing Checklist

### Before Submitting a Screen

- [ ] **Colors**: All from constants, no hardcoded hex
- [ ] **Spacing**: All from spacing system, no hardcoded px
- [ ] **Radius**: All from radius system (sm/md/lg/full)
- [ ] **Typography**: Font sizes from typography scale
- [ ] **Touch targets**: All interactive elements ≥44px
- [ ] **Contrast**: Text readable (4.5:1 minimum)
- [ ] **Animations**: Smooth, purposeful, respect prefers-reduced-motion
- [ ] **Safe areas**: Notch and nav bar safe (use SafeAreaView)
- [ ] **iOS**: Tested on iPhone 12+ (notch simulation)
- [ ] **Android**: Tested on Android 12+ (nav bar)
- [ ] **Light mode**: Looks good
- [ ] **Dark mode**: Ready for implementation (uses constants)
- [ ] **Orientation**: Works in portrait and landscape

---

## 🐛 Common Issues & Solutions

### Issue: Colors Look Washed Out
**Solution:** You're probably using `colors.textMuted` where `colors.textSecondary` is needed.

```typescript
// ❌ Wrong
<Text style={{ color: colors.textMuted }}>Important text</Text>

// ✅ Right
<Text style={{ color: colors.textSecondary }}>Important text</Text>
```

### Issue: Spacing Looks Inconsistent
**Solution:** Using hardcoded values instead of spacing constants.

```typescript
// ❌ Wrong
<View style={{ padding: 16, gap: 12 }}>

// ✅ Right
<View style={{ padding: spacing.lg, gap: spacing.md }}>
```

### Issue: Card Styling Is Off
**Solution:** Missing border or using wrong radius.

```typescript
// ❌ Wrong
<View style={{ backgroundColor: colors.background, borderRadius: 10 }}>

// ✅ Right
<View style={{
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  padding: spacing.lg,
}}>
```

### Issue: Animations Are Janky
**Solution:** Using JavaScript animations instead of Reanimated.

```typescript
// ❌ Wrong
const [scale, setScale] = useState(1);
setScale(isActive ? 1.1 : 1); // Re-renders on every change

// ✅ Right
const scale = useSharedValue(1);
scale.value = withSpring(isActive ? 1.1 : 1); // Native thread
```

---

## 📚 Reference Files

### Always Look At
- `src/app/login.tsx` - Login pattern (form styling, animations)
- `src/app/(tabs)/index.tsx` - List pattern (card structure, spacing)
- `src/app/(tabs)/_layout.tsx` - Tab bar pattern (icons, animations)
- `src/components/issue-card.tsx` - Card pattern (all conventions)

### Keep Handy
- `DESIGN_QUICK_REFERENCE.md` - Quick lookup
- `src/constants/colors.ts` - Color definitions
- `src/constants/ui-theme.ts` - Spacing/radius/typography

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation ✅
- [x] Login screen redesigned
- [x] Home screen redesigned
- [x] Tab bar updated
- [x] Design constants defined
- [x] Documentation created

### Phase 2: Additional Screens
- [ ] Profile screen (apply same patterns)
- [ ] Work/maintenance screen (same patterns)
- [ ] Notifications screen (similar layout)
- [ ] Issue detail screen (expanded view)

### Phase 3: Polish
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error boundaries
- [ ] Gesture handling

### Phase 4: Quality
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Dark mode implementation
- [ ] User testing

---

## 🎓 Learning Path

1. **Read the Design Guide**
   - `DESIGN_TASTE.md` - Full design vision

2. **Reference the Quick Guide**
   - `DESIGN_QUICK_REFERENCE.md` - Quick lookups

3. **Study the Implementations**
   - Login: `src/app/login.tsx`
   - Home: `src/app/(tabs)/index.tsx`
   - Card: `src/components/issue-card.tsx`

4. **Copy the Patterns**
   - Use the examples from this guide
   - Apply to new screens

5. **Follow the Checklist**
   - Use testing checklist before submitting

6. **Ask Questions**
   - Reference `TASTE_IMPROVEMENT.md` for why changes were made

---

## 🎯 Design Principles Summary

**Remember these when building:**

1. **Purpose First** - Every design decision communicates something
2. **Hierarchy Matters** - Size, weight, color create visual flow
3. **Consistency Rules** - System over exceptions
4. **Motion Justified** - Only animate when it adds meaning
5. **Touch First** - 44px+ targets, safe areas matter
6. **Accessible Always** - Contrast, readability, clarity
7. **Professional Polish** - Details matter (spacing, shadows, timing)

---

## 📞 Support

### If Something Doesn't Look Right
1. Check `DESIGN_QUICK_REFERENCE.md`
2. Reference an example screen
3. Verify you're using constants (not hardcoded values)
4. Check the testing checklist

### If You Need to Extend
1. Start with existing component as reference
2. Use same patterns (spacing, colors, radius)
3. Keep it simple (no AI tells)
4. Get design review before shipping

---

**Version:** 1.0  
**Last Updated:** August 2026  
**Design Direction: Human. Simple. Elegant. Modern. ✨**

