# Implementation Plan

- [x] 1. Set up project structure and prepare assets
  - Create new component directories and files
  - Optimize and convert hero image to WebP format
  - Verify all required dependencies are installed
  - _Requirements: 7.1, 7.2_

- [x] 1.1 Create component file structure
  - Create `components/landing/trust-badges.tsx`
  - Create `components/landing/how-it-works-section.tsx`
  - Create `components/landing/user-types-section.tsx`
  - Create `components/layout/mobile-menu.tsx`
  - Create `components/layout/footer.tsx`
  - _Requirements: All_

- [x] 1.2 Optimize hero background image
  - Convert `/public/img/hero-satellite-earth.jpg` to WebP format
  - Generate responsive image sizes (mobile: 768px, tablet: 1024px, desktop: 1920px)
  - Save optimized images in `/public/img/` directory
  - Keep original JPEG as fallback
  - _Requirements: 7.1, 7.2_

- [x] 2. Implement TrustBadges component
  - Create component with TypeScript interfaces
  - Implement 4 default trust badges with icons
  - Add Framer Motion animations (fade-up with stagger)
  - Implement responsive grid layout (2x2 mobile, 1x4 desktop)
  - Add hover effects and styling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2.1 Create TrustBadges component structure
  - Define `TrustBadgesProps` and `TrustBadge` interfaces
  - Create functional component with default badges data
  - Import required Lucide icons (Shield, CheckCircle, Lock, RefreshCw)
  - Set up component exports
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Implement TrustBadges layout and styling
  - Create responsive grid layout using Tailwind
  - Apply backdrop blur and opacity backgrounds
  - Style text with proper hierarchy and colors
  - Ensure proper spacing and alignment
  - _Requirements: 2.5, 2.7_

- [x] 2.3 Add TrustBadges animations
  - Implement Framer Motion fade-up entrance
  - Add staggered delay for each badge (0.1s increments)
  - Add hover scale and opacity effects
  - Test animation performance
  - _Requirements: 2.4, 2.6_

- [x] 3. Implement HowItWorksSection component
  - Create component with TypeScript interfaces
  - Implement 3 workflow steps with data
  - Add step numbers, icons, and descriptions
  - Implement responsive layout (horizontal desktop, vertical mobile)
  - Add scroll-triggered animations
  - Add connecting lines between steps on desktop
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 3.1 Create HowItWorksSection component structure
  - Define `HowItWorksSectionProps` and `WorkflowStep` interfaces
  - Create functional component with 3 default steps
  - Import required icons (Search, Map, Download)
  - Set up component exports
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 3.2 Implement HowItWorksSection layout
  - Create section header with title and subtitle
  - Implement step cards with number badges
  - Add responsive grid (horizontal on desktop, vertical on mobile)
  - Style cards with backdrop blur and borders
  - Add connecting arrows/lines between steps on desktop
  - _Requirements: 1.1, 1.7_

- [x] 3.3 Add HowItWorksSection animations
  - Implement scroll-triggered animation using Framer Motion
  - Add staggered entrance for each step card
  - Add hover effects (scale, shadow)
  - Test animation timing and performance
  - _Requirements: 1.5, 1.6_

- [x] 4. Implement MobileMenu component
  - Create component with TypeScript interfaces
  - Implement slide-in animation from right
  - Add backdrop overlay with fade effect
  - Implement body scroll lock
  - Add close button and outside-click handling
  - Include search bar and auth buttons
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 4.1 Create MobileMenu component structure
  - Define `MobileMenuProps` interface
  - Create functional component with state management
  - Import required dependencies (Framer Motion, icons)
  - Set up component exports
  - _Requirements: 3.1_

- [x] 4.2 Implement MobileMenu layout and styling
  - Create full-height sidebar with proper width
  - Add backdrop overlay with click handler
  - Style menu with dark background and backdrop blur
  - Implement navigation links with touch-friendly sizes (min 44px)
  - Add search bar at top and auth buttons at bottom
  - _Requirements: 3.2, 3.3, 3.8, 3.9_

- [x] 4.3 Implement MobileMenu animations and interactions
  - Add Framer Motion slide-in animation from right
  - Implement backdrop fade-in/out effect
  - Add body scroll lock when menu is open
  - Implement close button handler
  - Add outside-click detection to close menu
  - Add escape key handler to close menu
  - Handle navigation link clicks to close menu
  - _Requirements: 3.2, 3.4, 3.5, 3.6, 3.7, 3.10_

- [x] 5. Update LandingHeader with mobile menu integration
  - Add state for mobile menu open/close
  - Add hamburger icon button for mobile screens
  - Integrate MobileMenu component
  - Hide full navigation on mobile screens
  - Ensure proper z-index layering
  - _Requirements: 3.1, 3.2_

- [x] 5.1 Modify LandingHeader component
  - Add `useState` for mobile menu open state
  - Add hamburger menu button (visible only on mobile)
  - Import and render MobileMenu component
  - Pass required props to MobileMenu
  - Hide desktop navigation links on mobile (< 768px)
  - _Requirements: 3.1, 3.2_

- [x] 6. Implement UserTypesSection component
  - Create component with TypeScript interfaces
  - Implement 4 user type cards with data
  - Add icons, titles, descriptions, and benefits
  - Implement responsive grid layout (2x2 desktop, vertical mobile)
  - Add hover effects and animations
  - Add individual CTAs for each card
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x] 6.1 Create UserTypesSection component structure
  - Define `UserTypesSectionProps` and `UserType` interfaces
  - Create functional component with 4 default user types
  - Import required icons (Building2, GraduationCap, Briefcase, Users)
  - Set up component exports
  - _Requirements: 4.2, 4.3_

- [x] 6.2 Implement UserTypesSection layout and styling
  - Create section header with title
  - Implement user type cards with icon badges
  - Add responsive grid (2x2 on desktop/tablet, vertical on mobile)
  - Style cards consistent with features section
  - Display benefits as bulleted list
  - Add CTA button to each card
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.8_

- [x] 6.3 Add UserTypesSection animations and interactions
  - Implement staggered entrance animation
  - Add hover effects with gradient overlay
  - Add hover scale and shadow effects
  - Implement CTA button navigation
  - _Requirements: 4.7, 4.9, 4.10_

- [x] 7. Enhance ContributingOrganizations component with search and filters
  - Add search input field with debounced filtering
  - Extract and display category filter buttons
  - Implement real-time filtering logic
  - Add organization count display
  - Add "Clear All" button when filters active
  - Add "Become a Partner" CTA button
  - Handle empty results state
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9, 5.10, 5.11_

- [x] 7.1 Add search functionality to ContributingOrganizations
  - Add search input field above organization cards
  - Implement `useState` for search query
  - Create debounced search handler (300ms delay)
  - Filter organizations by name and description
  - Update filtered organizations state
  - _Requirements: 5.1, 5.2_

- [x] 7.2 Add category filtering to ContributingOrganizations
  - Extract unique categories from organizations
  - Create category filter buttons
  - Implement `useState` for selected category
  - Filter organizations by selected category
  - Combine search and category filters
  - _Requirements: 5.3, 5.4_

- [x] 7.3 Add UI enhancements to ContributingOrganizations
  - Display count of visible organizations
  - Add "Clear All" button when filters are active
  - Implement clear filters handler
  - Add "Become a Partner" CTA button
  - Handle empty results with message
  - Animate transitions with AnimatePresence
  - _Requirements: 5.5, 5.6, 5.8, 5.9, 5.10, 5.11_

- [x] 8. Implement Footer component
  - Create component with TypeScript interfaces
  - Implement 4-column layout (About, Quick Links, Legal, Connect)
  - Add newsletter signup form with validation
  - Add social media icons
  - Add NGDI logo and copyright
  - Implement responsive column stacking
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14_

- [x] 8.1 Create Footer component structure
  - Define `FooterProps`, `FooterSection`, and `FooterLink` interfaces
  - Create functional component with section data
  - Import required icons and components
  - Set up component exports
  - _Requirements: 6.1, 6.2_

- [x] 8.2 Implement Footer layout and sections
  - Create 4-column grid layout
  - Implement "About" section with description
  - Implement "Quick Links" section with navigation
  - Implement "Legal" section with policy links
  - Implement "Connect" section with social icons
  - Add responsive column stacking (4-col → 2x2 → vertical)
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 8.3 Implement Footer newsletter signup
  - Create newsletter form with email input
  - Add email validation (format check)
  - Implement form submission handler
  - Display success/error messages
  - Style form consistent with design system
  - _Requirements: 6.6, 6.11, 6.12_

- [x] 8.4 Style Footer and add branding
  - Apply dark background (bg-slate-900)
  - Add border-top separator
  - Add NGDI logo at bottom
  - Add copyright text
  - Implement link hover effects
  - Ensure proper spacing and typography
  - _Requirements: 6.10, 6.13, 6.14_

- [x] 9. Create newsletter subscription server action
  - Create server action file for newsletter
  - Define newsletter subscription interface
  - Implement email validation logic
  - Create database schema for subscriptions (if needed)
  - Implement subscription storage logic
  - Return ActionState with success/error
  - _Requirements: 6.11, 6.12_

- [x] 9.1 Create newsletter server action
  - Create `actions/newsletter-actions.ts` file
  - Define `NewsletterSubscription` interface
  - Implement `subscribeToNewsletterAction` function
  - Add email format validation using Zod
  - Add error handling and logging
  - Return appropriate ActionState
  - _Requirements: 6.11, 6.12_

- [x] 10. Update HomePage to integrate all new components
  - Import all new components
  - Add TrustBadges to HeroSection
  - Add UserTypesSection after HeroSection
  - Add HowItWorksSection before FeaturesSection
  - Add Footer at the bottom
  - Ensure proper component ordering and spacing
  - _Requirements: All_

- [x] 10.1 Modify HeroSection to include TrustBadges
  - Import TrustBadges component
  - Add TrustBadges below CTA buttons in hero content
  - Ensure proper spacing and alignment
  - Test responsive layout
  - _Requirements: 2.1_

- [x] 10.2 Update HomePage component structure
  - Import UserTypesSection, HowItWorksSection, Footer
  - Add UserTypesSection after HeroSection
  - Add HowItWorksSection before UnifiedGeospatialBackground
  - Add Footer after UnifiedGeospatialBackground
  - Adjust spacing between sections
  - Test overall page flow and layout
  - _Requirements: 1.1, 4.1, 6.1_

- [x] 11. Implement performance optimizations
  - Update hero image to use optimized WebP
  - Implement lazy loading for globe component
  - Add font preloading
  - Inline critical SVG patterns
  - Optimize component rendering
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15_

- [x] 11.1 Optimize hero background image
  - Update HeroSection to use Next.js Image component
  - Set image src to WebP version with JPEG fallback
  - Add `priority` prop for above-fold loading
  - Configure responsive `sizes` attribute
  - Set appropriate `quality` prop (90)
  - Test image loading and fallback
  - _Requirements: 7.1, 7.2, 7.3, 7.8_

- [x] 11.2 Implement lazy loading for globe component
  - Verify globe component uses dynamic import
  - Add intersection observer if needed
  - Ensure globe doesn't block above-fold rendering
  - Test loading behavior and performance
  - _Requirements: 7.4, 7.5, 7.14_

- [x] 11.3 Add font preloading and optimize assets
  - Add font preload links in app/layout.tsx
  - Inline small SVG patterns in UnifiedGeospatialBackground
  - Optimize larger SVGs with SVGO
  - Verify critical CSS is inlined
  - _Requirements: 7.6, 7.7, 7.15_

- [x] 11.4 Optimize animations for performance
  - Ensure all animations use CSS transforms and opacity
  - Add `will-change` only where necessary
  - Implement intersection observer for scroll animations
  - Test animation performance on low-end devices
  - _Requirements: 7.12_

- [ ] 12. Testing and quality assurance
  - Write unit tests for new components
  - Perform integration testing
  - Run accessibility tests
  - Run performance tests with Lighthouse
  - Test responsive layouts on all breakpoints
  - Fix any issues found
  - _Requirements: All_

- [ ] 12.1 Write unit tests for new components
  - Test TrustBadges rendering and props
  - Test HowItWorksSection step display
  - Test MobileMenu open/close functionality
  - Test UserTypesSection card rendering
  - Test organization filtering logic
  - Test newsletter email validation
  - Test Footer link rendering
  - _Requirements: All_

- [ ] 12.2 Perform integration and accessibility testing
  - Test mobile menu navigation flow
  - Test organization search and filter interaction
  - Test newsletter form submission
  - Test keyboard navigation for mobile menu
  - Test screen reader compatibility
  - Verify color contrast ratios
  - Verify touch target sizes (min 44px)
  - Test ARIA labels and roles
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.11_

- [ ] 12.3 Run performance tests and optimizations
  - Run Lighthouse performance audit
  - Verify LCP < 2.5s on 3G connection
  - Verify FID < 100ms
  - Verify CLS < 0.1
  - Check bundle sizes
  - Verify image optimization
  - Test on various devices and connections
  - Fix any performance issues
  - _Requirements: 7.9, 7.10, 7.11, 7.13_

- [ ] 12.4 Test responsive layouts
  - Test on mobile (320px - 767px)
  - Test on tablet (768px - 1023px)
  - Test on desktop (1024px+)
  - Test on large desktop (1440px+)
  - Verify all components adapt properly
  - Fix any layout issues
  - _Requirements: All responsive requirements_

- [ ] 13. Documentation and deployment preparation
  - Update component documentation
  - Add JSDoc comments to new components
  - Update README if needed
  - Create deployment checklist
  - Prepare rollback plan
  - _Requirements: All_

- [ ] 13.1 Document new components
  - Add JSDoc comments to all new components
  - Document props and interfaces
  - Add usage examples in comments
  - Update any relevant documentation files
  - _Requirements: All_

- [ ] 13.2 Prepare for deployment
  - Create deployment checklist
  - Document rollback procedure
  - Set up monitoring for new features
  - Prepare feature flags if needed
  - Review all changes one final time
  - _Requirements: All_
