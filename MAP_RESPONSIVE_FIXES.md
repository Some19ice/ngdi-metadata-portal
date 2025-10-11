# Map Page Responsive Height Fixes

## Issues Identified

The /map page had several responsive height issues:

1. **Layout Container**: Used `min-h-[calc()]` instead of fixed height, causing layout overflow
2. **Map Container**: Missing proper flex constraints and height calculations
3. **Sidebar**: Not properly constrained, causing viewport overflow
4. **Map View Component**: Missing `h-full` class for proper container filling

## Fixes Applied

### 1. Map Layout (`app/map/layout.tsx`)

```tsx
// Before: Used min-height with complex margin calculations
<div className="-ml-2 md:-ml-3 -mb-4 md:-mb-6 pt-1 pr-4 md:pr-6 min-h-[calc(100vh-var(--banner-height)-var(--header-height)-0.25rem)] w-[calc(100%+0.5rem)] md:w-[calc(100%+0.75rem)]">

// After: Fixed height container with proper constraints
<div className="h-[calc(100vh-var(--banner-height)-var(--header-height))] max-h-[calc(100vh-var(--banner-height)-var(--header-height))] w-full overflow-hidden">
```

### 2. Map Page (`app/map/page.tsx`)

```tsx
// Before: Relative positioning
<div className="relative w-full h-full">

// After: Simple full height container
<div className="h-full w-full">
```

### 3. Map Loading Skeleton (`app/map/_components/map-loading-skeleton.tsx`)

```tsx
// Before: Relative positioning with absolute overlay
<div className="relative w-full h-full...">

// After: Full height container
<div className="w-full h-full...">
```

### 4. Map Wrapper (`app/map/_components/map-wrapper.tsx`)

```tsx
// Before: Basic flex container
<div className="flex h-full bg-gray-50 gap-4">

// After: Constrained flex container with overflow control
<div className="flex h-full max-h-full bg-gray-50 gap-4 p-4 overflow-hidden">

// Sidebar improvements
<div className={`...${sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-80 max-w-80"}`}>

// Map container improvements
<div className="flex-1 relative overflow-hidden rounded-lg shadow-lg min-h-0">
```

### 5. Map View (`components/ui/map/map-view.tsx`)

```tsx
// Before: Missing height constraint
<div className={`relative ${className}`}>

// After: Full height container
<div className={`relative h-full ${className}`}>
```

### 6. Mobile Drawer Height

```tsx
// Before: Fixed height
<DrawerContent className="h-[85vh] p-0 overflow-hidden">

// After: Maximum height with constraints
<DrawerContent className="max-h-[85vh] p-0 overflow-hidden">
<div className="h-full max-h-[80vh] overflow-y-auto...">
```

## Key Improvements

### Responsive Design

- **Viewport-relative heights**: Uses CSS calc() with CSS variables for banner and header heights
- **Proper overflow handling**: Added `overflow-hidden` at container level
- **Flex constraints**: Used `min-h-0` on flex items to prevent overflow
- **Maximum height limits**: Added `max-h-full` constraints where needed

### Mobile Optimization

- **Drawer height limits**: Constrained mobile drawer to 85vh maximum
- **Scrollable content**: Proper scroll handling within constrained containers
- **Touch-friendly**: Maintained proper touch interactions

### Desktop Layout

- **Sidebar responsiveness**: Smooth transitions with proper width constraints
- **Map filling**: Map container properly fills remaining space
- **Overflow control**: Prevented sidebar content from breaking layout

## CSS Variables Used

The layout uses these CSS variables defined in the root:

- `--banner-height: 3.5rem` (56px)
- `--header-height: 4rem` (64px)

Total reserved height: 120px (banner + header)
Available map height: `calc(100vh - 120px)`

## Result

The /map page now:

- ✅ Properly fills the viewport height on all screen sizes
- ✅ Responsive to different browser sizes and mobile viewports
- ✅ Sidebar and map container heights are properly constrained
- ✅ Smooth transitions and proper overflow handling
- ✅ Mobile-friendly with appropriate drawer heights
- ✅ No layout shift or overflow issues

The map and sidebar now properly adapt to the screen size and maintain their proportions across different devices and viewport sizes.
