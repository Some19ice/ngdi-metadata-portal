# Design Document

## Overview

This design document outlines the technical architecture and implementation approach for enhancing the NGDI Metadata Portal landing page. The enhancements focus on improving user engagement, mobile experience, trust building, and performance optimization while maintaining the existing visual design language and technical stack.

The design leverages Next.js 15 with App Router, React 18, TypeScript, Tailwind CSS, Framer Motion for animations, and follows the established component patterns in the codebase.

## Architecture

### Component Hierarchy

```
app/page.tsx (HomePage)
├── HeroSection
│   ├── LandingHeader (with mobile menu)
│   ├── Hero Content
│   └── TrustBadges (new)
├── UserTypesSection (new)
├── HowItWorksSection (new)
├── UnifiedGeospatialBackground
│   ├── FeaturesSection
│   └── ContributingOrganizationsFetcher
│       └── ContributingOrganizations (enhanced)
└── Footer (new)
```

### File Structure

```
components/
├── landing/
│   ├── hero-section.tsx (modified)
│   ├── trust-badges.tsx (new)
│   ├── how-it-works-section.tsx (new)
│   ├── user-types-section.tsx (new)
│   └── features-section.tsx (existing)
├── layout/
│   ├── landing-header.tsx (modified - add mobile menu)
│   ├── mobile-menu.tsx (new)
│   └── footer.tsx (new)
└── ui/
    └── organization-carousel.tsx (modified - add search/filter)

app/
├── page.tsx (modified)
└── _components/
    ├── contributing-organizations.tsx (modified)
    └── contributing-organizations-fetcher.tsx (existing)

public/
└── img/
    └── hero-satellite-earth.webp (new - optimized)
```

## Components and Interfaces

### 1. TrustBadges Component

**Purpose:** Display credibility indicators in the hero section

**Location:** `components/landing/trust-badges.tsx`

**Props Interface:**

```typescript
interface TrustBadgesProps {
  className?: string
  badges?: TrustBadge[]
}

interface TrustBadge {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
}
```

**Key Features:**

- Displays 4 trust indicators by default
- Animated fade-up entrance with staggered timing
- Hover effects for interactivity
- Responsive grid layout (2x2 on mobile, 1x4 on desktop)
- Uses Lucide icons: Shield, CheckCircle, Lock, RefreshCw

**Styling:**

- Backdrop blur with white/10 opacity background
- Border with white/20 opacity
- Text in white/90 for readability
- Hover: scale-105 transform, increased opacity

### 2. HowItWorksSection Component

**Purpose:** Explain the portal usage in 3 simple steps

**Location:** `components/landing/how-it-works-section.tsx`

**Props Interface:**

```typescript
interface HowItWorksSectionProps {
  className?: string
  steps?: WorkflowStep[]
}

interface WorkflowStep {
  id: string
  number: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}
```

**Key Features:**

- 3 steps: Search & Discover, Explore & Analyze, Access & Download
- Step numbers displayed prominently
- Icons: Search, Map, Download
- Connecting lines/arrows between steps on desktop
- Staggered animation on scroll into view
- Card-based layout with hover effects

**Styling:**

- Section padding: py-24
- Max width: max-w-7xl
- Card background: bg-card/80 with backdrop-blur
- Step numbers: Large circular badges with gradient
- Responsive: horizontal on desktop, vertical on mobile

### 3. MobileMenu Component

**Purpose:** Provide mobile-friendly navigation

**Location:** `components/layout/mobile-menu.tsx`

**Props Interface:**

```typescript
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  showSearchBar?: boolean
}
```

**Key Features:**

- Slide-in animation from right
- Backdrop overlay with fade effect
- Body scroll lock when open
- Touch-friendly link sizes (min 44px height)
- Includes search bar at top
- Auth buttons at bottom
- Close button and outside-click handling

**Styling:**

- Full-height sidebar: h-screen w-80
- Background: bg-slate-900 with backdrop-blur
- Overlay: bg-black/50
- Animation: Framer Motion slideInRight
- Z-index: z-50 for overlay, z-[60] for menu

**State Management:**

- Uses React useState for open/close state
- useEffect for body scroll lock
- useEffect for escape key handling

### 4. UserTypesSection Component

**Purpose:** Segment users by role and show relevant benefits

**Location:** `components/landing/user-types-section.tsx`

**Props Interface:**

```typescript
interface UserTypesSectionProps {
  className?: string
  userTypes?: UserType[]
}

interface UserType {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  benefits: string[]
  ctaText: string
  ctaLink: string
}
```

**Key Features:**

- 4 user categories with distinct icons
- Icons: Building2 (Government), GraduationCap (Researchers), Briefcase (Private Sector), Users (Public)
- 3-4 benefits per user type
- Individual CTAs for each card
- Hover effects with gradient overlay
- Staggered animation on load

**Styling:**

- Grid layout: 2x2 on desktop/tablet, 1x4 on mobile
- Card design consistent with features section
- Icon in colored circle badge
- Benefits as bulleted list with custom markers
- CTA button with arrow icon

### 5. Enhanced ContributingOrganizations Component

**Purpose:** Add search and filter capabilities to organizations display

**Location:** `app/_components/contributing-organizations.tsx`

**Modified Props Interface:**

```typescript
interface ContributingOrganizationsProps {
  organizations: PublicOrganization[]
  categories?: string[] // new
}
```

**New State:**

```typescript
const [searchQuery, setSearchQuery] = useState("")
const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
const [filteredOrgs, setFilteredOrgs] = useState(organizations)
```

**Key Features:**

- Search input with debounced filtering
- Category filter buttons (extracted from organizations)
- Real-time filtering with smooth transitions
- Organization count display
- "Clear All" button when filters active
- "Become a Partner" CTA button
- Dataset count on hover (requires data model update)

**Filtering Logic:**

```typescript
// Filter by search query (name, description)
// Filter by selected category
// Update filteredOrgs state
// Animate transitions with AnimatePresence
```

### 6. Footer Component

**Purpose:** Provide comprehensive site navigation and information

**Location:** `components/layout/footer.tsx`

**Props Interface:**

```typescript
interface FooterProps {
  className?: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterLink {
  label: string
  href: string
  external?: boolean
}
```

**Key Features:**

- 4-column layout: About, Quick Links, Legal, Connect
- Newsletter signup form with validation
- Social media icons
- NGDI logo and copyright
- Responsive column stacking
- Form submission handling

**Sections:**

1. **About:** Portal description, mission statement
2. **Quick Links:** Docs, API, Support, FAQ, Contact
3. **Legal:** Privacy, Terms, Cookies, Accessibility
4. **Connect:** Social icons, newsletter form

**Styling:**

- Background: bg-slate-900 text-white
- Border top: border-t border-slate-800
- Padding: py-12
- Column gap: gap-8
- Newsletter input: Integrated with existing form components

### 7. Performance Optimizations

**Image Optimization:**

```typescript
// Convert hero image to WebP
// public/img/hero-satellite-earth.webp
// Use Next.js Image component with priority

<Image
  src="/img/hero-satellite-earth.webp"
  alt="Satellite view of Earth"
  fill
  className="object-cover"
  priority
  quality={90}
  sizes="100vw"
/>
```

**Lazy Loading:**

```typescript
// Globe component already uses dynamic import
// Ensure it's below the fold or add intersection observer

const GlobeDemo = dynamic(
  () => import("@/components/hero-globe"),
  {
    ssr: false,
    loading: () => <GlobeSkeleton />
  }
)
```

**Font Preloading:**

```typescript
// In app/layout.tsx, add to head
<link
  rel="preload"
  href="/fonts/inter-var.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

**SVG Optimization:**

```typescript
// Inline small SVG patterns
// Or use next/image for larger SVGs
// Optimize with SVGO
```

## Data Models

### TrustBadge Data

```typescript
const defaultTrustBadges: TrustBadge[] = [
  {
    id: "government",
    icon: Shield,
    label: "Government Approved",
    description: "Official NGDI Portal"
  },
  {
    id: "iso",
    icon: CheckCircle,
    label: "ISO 19115 Compliant",
    description: "International standards"
  },
  {
    id: "security",
    icon: Lock,
    label: "Secure & Encrypted",
    description: "Enterprise-grade security"
  },
  {
    id: "updated",
    icon: RefreshCw,
    label: "Updated Daily",
    description: "Fresh data"
  }
]
```

### WorkflowStep Data

```typescript
const defaultSteps: WorkflowStep[] = [
  {
    id: "search",
    number: 1,
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse our comprehensive catalog of geospatial datasets using advanced search filters and spatial queries."
  },
  {
    id: "explore",
    number: 2,
    icon: Map,
    title: "Explore & Analyze",
    description:
      "Visualize datasets on interactive maps with multi-layer support and real-time rendering capabilities."
  },
  {
    id: "access",
    number: 3,
    icon: Download,
    title: "Access & Download",
    description:
      "Download datasets or integrate via our RESTful APIs and OGC-compliant web services."
  }
]
```

### UserType Data

```typescript
const defaultUserTypes: UserType[] = [
  {
    id: "government",
    icon: Building2,
    title: "Government Agencies",
    description:
      "Streamline data sharing and collaboration across federal, state, and local agencies.",
    benefits: [
      "Centralized metadata management",
      "Inter-agency data sharing",
      "Compliance with national standards",
      "Audit trails and governance"
    ],
    ctaText: "For Government",
    ctaLink: "/solutions/government"
  },
  {
    id: "researchers",
    icon: GraduationCap,
    title: "Researchers",
    description:
      "Access comprehensive geospatial data for academic research and analysis.",
    benefits: [
      "Extensive dataset catalog",
      "API access for automation",
      "Citation and attribution tools",
      "Collaboration features"
    ],
    ctaText: "For Research",
    ctaLink: "/solutions/research"
  },
  {
    id: "private",
    icon: Briefcase,
    title: "Private Sector",
    description:
      "Leverage geospatial data for business intelligence and decision-making.",
    benefits: [
      "Commercial data access",
      "Integration capabilities",
      "Custom data requests",
      "Technical support"
    ],
    ctaText: "For Business",
    ctaLink: "/solutions/business"
  },
  {
    id: "public",
    icon: Users,
    title: "General Public",
    description:
      "Explore Nigeria's geospatial data for education, planning, and awareness.",
    benefits: [
      "Free public datasets",
      "Easy-to-use interface",
      "Educational resources",
      "Community forums"
    ],
    ctaText: "Get Started",
    ctaLink: "/signup"
  }
]
```

### Newsletter Subscription

```typescript
interface NewsletterSubscription {
  email: string
  subscribedAt: Date
  source: "footer" | "modal" | "other"
}

// Server action for newsletter signup
async function subscribeToNewsletterAction(
  email: string
): Promise<ActionState<void>>
```

## Error Handling

### Mobile Menu

- Handle escape key press to close menu
- Handle outside click to close menu
- Prevent body scroll when menu is open
- Handle navigation errors gracefully

### Organization Search/Filter

- Handle empty search results with clear message
- Debounce search input to prevent excessive filtering
- Handle missing organization data gracefully
- Provide clear filters button when no results

### Newsletter Signup

- Validate email format before submission
- Display error message for invalid emails
- Display success message after successful subscription
- Handle API errors with user-friendly messages
- Prevent duplicate submissions

### Image Loading

- Provide fallback for WebP unsupported browsers
- Display skeleton/placeholder while images load
- Handle image load errors with fallback images
- Optimize for different screen sizes

### Performance

- Monitor Core Web Vitals in production
- Log slow component renders
- Track bundle sizes
- Monitor API response times

## Testing Strategy

### Unit Tests

- TrustBadges component rendering
- HowItWorksSection step display
- MobileMenu open/close functionality
- UserTypesSection card rendering
- Organization filtering logic
- Newsletter email validation
- Footer link rendering

### Integration Tests

- Mobile menu navigation flow
- Organization search and filter interaction
- Newsletter form submission
- Footer navigation links
- Trust badges animation timing
- How It Works section scroll animation

### Visual Regression Tests

- Hero section with trust badges
- Mobile menu open/closed states
- How It Works section layout
- User Types section grid
- Organizations section with filters
- Footer layout on different screen sizes

### Performance Tests

- Lighthouse performance score >= 90
- LCP < 2.5s on 3G
- FID < 100ms
- CLS < 0.1
- Image optimization verification
- Bundle size analysis

### Accessibility Tests

- Keyboard navigation for mobile menu
- Screen reader compatibility
- Focus management in mobile menu
- Color contrast ratios
- Touch target sizes (min 44px)
- ARIA labels and roles

### Responsive Tests

- Mobile (320px - 767px)
- Tablet (768px - 1023px)
- Desktop (1024px+)
- Large desktop (1440px+)

## Implementation Notes

### Animation Performance

- Use CSS transforms and opacity for GPU acceleration
- Avoid animating layout properties (width, height, top, left)
- Use `will-change` sparingly and only when needed
- Implement intersection observer for scroll-triggered animations

### Mobile Menu Implementation

- Use Framer Motion for smooth animations
- Implement focus trap when menu is open
- Restore focus to trigger button when menu closes
- Use portal for menu to avoid z-index issues

### Organization Filtering

- Implement debounced search (300ms delay)
- Use useMemo for filtered results
- Animate list changes with AnimatePresence
- Maintain scroll position when filtering

### Newsletter Integration

- Create server action for email subscription
- Integrate with email service (e.g., SendGrid, Mailchimp)
- Store subscriptions in database
- Send confirmation email
- Handle unsubscribe requests

### Image Optimization Workflow

1. Convert hero image to WebP using Sharp or similar
2. Generate multiple sizes for responsive images
3. Update Image component with proper sizes attribute
4. Test fallback for unsupported browsers
5. Verify performance improvements with Lighthouse

### SEO Considerations

- Add structured data for organization
- Update meta descriptions
- Add alt text to all images
- Ensure proper heading hierarchy
- Add canonical URLs
- Implement breadcrumb navigation

## Dependencies

### New Dependencies

None required - all features use existing dependencies:

- framer-motion (already installed)
- lucide-react (already installed)
- next/image (built-in)
- React hooks (built-in)

### Existing Dependencies

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Drizzle ORM (for newsletter subscriptions)

## Migration Strategy

### Phase 1: Component Creation

1. Create TrustBadges component
2. Create HowItWorksSection component
3. Create MobileMenu component
4. Create UserTypesSection component
5. Create Footer component

### Phase 2: Component Integration

1. Integrate TrustBadges into HeroSection
2. Add HowItWorksSection to HomePage
3. Add UserTypesSection to HomePage
4. Integrate MobileMenu into LandingHeader
5. Add Footer to HomePage

### Phase 3: Enhancements

1. Add search/filter to ContributingOrganizations
2. Optimize hero image
3. Implement lazy loading
4. Add font preloading

### Phase 4: Testing & Optimization

1. Run performance tests
2. Fix any issues
3. Run accessibility tests
4. Run visual regression tests
5. Deploy to staging

### Rollback Plan

- Keep existing components unchanged until new ones are tested
- Use feature flags for gradual rollout
- Monitor error rates and performance metrics
- Have quick rollback procedure ready

## Performance Targets

### Core Web Vitals

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Additional Metrics

- **Time to Interactive:** < 3.5s
- **First Contentful Paint:** < 1.5s
- **Speed Index:** < 3.0s
- **Total Blocking Time:** < 200ms

### Bundle Size

- **Main bundle:** < 200KB gzipped
- **Component chunks:** < 50KB each
- **Total JavaScript:** < 500KB gzipped

### Image Optimization

- **Hero image:** < 200KB (WebP)
- **Organization logos:** < 20KB each
- **Icons:** Use SVG or icon fonts
- **Lazy load:** All below-fold images
