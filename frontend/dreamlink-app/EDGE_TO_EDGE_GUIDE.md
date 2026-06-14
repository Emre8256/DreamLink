# Edge-to-Edge Design Implementation Guide

## Overview
All screens in Dream-Link now use **EdgeToEdgeLayout** component for proper edge-to-edge rendering with safe area handling, dynamic StatusBar styling, and consistent padding hierarchy.

## Architecture

### Core Components

#### 1. **EdgeToEdgeLayout** (`components/EdgeToEdgeLayout.tsx`)
- Wraps the entire screen content
- Handles device insets (notch, home indicator, status bar)
- Manages StatusBar styling dynamically
- Props:
  - `backgroundColor`: Page background color
  - `statusBarStyle`: "dark-content" | "light-content"
  - `statusBarBg`: StatusBar background color
  - `safeEdges`: Which edges to apply safe area padding (default: top, bottom)

#### 2. **PageHeader** (`components/PageHeader.tsx`)
- Standardized header component with title, subtitle, and right element
- Automatically applies correct padding below status bar
- Usage:
  ```tsx
  <PageHeader 
    title="Profile" 
    subtitle="Manage your account"
    rightElement={<TouchableOpacity>...</TouchableOpacity>}
  />
  ```

#### 3. **PageContent** (`components/PageContent.tsx`)
- Manages scrollable/non-scrollable content with consistent padding
- Handles safe area insets for bottom (home indicator)
- Props:
  - `paddingHorizontal`: Horizontal padding (default: 22)
  - `scrollable`: Enable/disable scrolling (default: true)
  - `backgroundColor`: Content background color

## Padding Hierarchy

```
┌─ Device Screen Edge ─────────────────────────────────┐
│ (StatusBar area)                                      │
├─ EdgeToEdgeLayout (paddingTop: insets.top) ──────────┤
│  ┌─ Header Section ────────────────────────────────┐ │
│  │ paddingHorizontal: 22                           │ │
│  │ paddingVertical: 14                             │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─ Content Section (PageContent) ─────────────────┐ │
│  │ paddingHorizontal: 22 (default, customizable)  │ │
│  │ paddingVertical: 0 (default, customizable)     │ │
│  │ (auto-handles paddingBottom: insets.bottom)    │ │
│  └─────────────────────────────────────────────────┘ │
│ (Home Indicator area)                                 │
└──────────────────────────────────────────────────────┘
```

## Standard Padding Values

- **Header Horizontal**: `22px`
- **Content Horizontal**: `22px` (matches header)
- **Header Vertical**: `14px` (top & bottom)
- **Section Gaps**: `16-24px`
- **Safe Area**: Automatically managed by EdgeToEdgeLayout

## Screen Type Patterns

### Tab Screen (e.g., profile.tsx)
```tsx
<EdgeToEdgeLayout backgroundColor="#FFFFFF" statusBarStyle="dark-content" statusBarBg="#FFFFFF">
  <View style={styles.root}>
    <View style={styles.header}>
      <Text>Profile</Text>
    </View>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22 }}>
      {/* Content */}
    </ScrollView>
  </View>
</EdgeToEdgeLayout>
```

### Full-Screen Modal (e.g., login.tsx)
```tsx
<EdgeToEdgeLayout backgroundColor="#0a0705" statusBarStyle="light-content" statusBarBg="#0a0705">
  <View style={styles.root}>
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22 }}>
        {/* Form Content */}
      </ScrollView>
    </KeyboardAvoidingView>
  </View>
</EdgeToEdgeLayout>
```

## StatusBar Configuration

### Light Backgrounds (Dark Text)
```tsx
<EdgeToEdgeLayout 
  backgroundColor="#FFFFFF"
  statusBarStyle="dark-content"
  statusBarBg="#FFFFFF"
/>
```

### Dark Backgrounds (Light Text)
```tsx
<EdgeToEdgeLayout 
  backgroundColor="#0a0705"
  statusBarStyle="light-content"
  statusBarBg="#0a0705"
/>
```

## Implemented Screens (16 Total)

### Tab Screens (5)
- ✅ `app/(tabs)/index.tsx` (Home)
- ✅ `app/(tabs)/profile.tsx` (Profile)
- ✅ `app/(tabs)/matches.tsx` (Matches)
- ✅ `app/(tabs)/discover.tsx` (Discover)
- ✅ `app/(tabs)/chat.tsx` (Chats)

### Authentication Screens (2)
- ✅ `app/login.tsx`
- ✅ `app/welcome.tsx`

### Detail/Modal Screens (8)
- ✅ `app/dream/[id].tsx`
- ✅ `app/edit-profile.tsx`
- ✅ `app/user-profile.tsx`
- ✅ `app/profile-preview.tsx`
- ✅ `app/chatbox.tsx`
- ✅ `app/premium-upsell.tsx`
- ✅ `app/notifications.tsx`
- ✅ `app/dream-archive.tsx`

## Key Benefits

1. **Device-Aware Layout**: Automatically accounts for notch, home indicator, and status bar
2. **Consistent Styling**: All screens follow same StatusBar and padding patterns
3. **Professional Polish**: Content doesn't overlap with system UI elements
4. **Maintainability**: Centralized layout management in EdgeToEdgeLayout component
5. **Responsive**: Works across iOS (notch, safe area) and Android (system bars)

## Testing Checklist

- [ ] Verify StatusBar color matches background on each screen
- [ ] Check that header content is readable (not overlapped by status bar)
- [ ] Confirm content padding is consistent with design system (22px horizontal)
- [ ] Test on devices with notch (iPhone 12+, some Android phones)
- [ ] Test on devices with home indicator
- [ ] Verify bottom content clearance on all screens
- [ ] Test keyboard behavior on login/onboarding screens

## Future Updates

When adding new screens:
1. Import `EdgeToEdgeLayout` from `'../../components/EdgeToEdgeLayout'`
2. Wrap main View with EdgeToEdgeLayout
3. Set `backgroundColor`, `statusBarStyle`, and `statusBarBg` props
4. Use `22px` for horizontal padding consistency
5. Remove any manual `paddingTop: insets.top` (EdgeToEdgeLayout handles it)
6. Remove StatusBar import and direct StatusBar calls
