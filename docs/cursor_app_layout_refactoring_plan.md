# App Layout Refactoring Plan

_Exported on 5/19/2025 at 15:45:20 GMT+1 from Cursor (0.50.5)_

---

**User**

I Want to refactor the layout of the app. There seems to be multiple app layout for different part of the app. for example the layout of the (app) is different from the / landing page.

On the new app layout, their will be a banner at the top with NGDI logo, a header with a search bar withing + some nav links, this will just be below the banner.

Review the plan this

---

**Cursor**

```typescriptreact
    // app/layout.tsx
    "use server"; // Or "use client" if banner/header have client-side interactions

    import BannerComponent from "@/components/layout/banner";
    import HeaderComponent from "@/components/layout/header";
    // ... other necessary imports (fonts, global CSS)

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html>
          <body>
            <BannerComponent />
            <HeaderComponent />
            <main>
              {children}
            </main>
            {/* Footer if any */}
          </body>
        </html>
      );
    }
```

```typescriptreact
// app/layout.tsx
"use server"; // Or "use client" if interactivity is needed in banner/header

import { Inter } from "next/font/google";
import "./globals.css"; // Assuming global styles
import Banner from "@/components/layout/banner";
import MainHeader from "@/components/layout/main-header";
// Import PostHogProvider if it's still global
// import { PHProvider } from "@/components/utilities/posthog/posthog-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NGDI Portal", // Update as needed
  description: "National Geospatial Data Infrastructure Portal", // Update as needed
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <PHProvider> {/* If PostHog is used globally */}
      <html lang="en">
        <body className={inter.className}>
          <Banner />
          <MainHeader />
          <main className="pt-4 px-4"> {/* Add padding as needed */}
            {children}
          </main>
          {/* Optional: Global Footer Component here */}
        </body>
      </html>
    // </PHProvider>
  );
}
```

```typescriptreact
            // app/(auth)/layout.tsx
            "use server";
            import "../globals.css"; // Import necessary global styles

            export default function AuthLayout({ children }: { children: React.ReactNode }) {
              return (
                <html lang="en">
                  <body>
                    <div className="auth-container"> {/* Minimal styling for auth pages */}
                      {children}
                    </div>
                  </body>
                </html>
              );
            }
```

Okay, I understand you want to refactor your application's layout to achieve a more unified look and feel. The goal is to have a consistent top banner with the NGDI logo, and a header below it containing a search bar and navigation links, which will apply to most parts of the app, including the landing page and the `(app)` section.

Here's a plan for how we can approach this refactor:

**Overall Goal:** Implement a unified application layout featuring a top banner (with NGDI logo) and a header (with search bar and navigation links) below the banner. This layout will be the default for most of the application.

**1. Create New Layout Components:**

We'll create a set of reusable components for the new layout elements. These will be placed in the `components/` directory.

- **`Banner` Component:**
  - **File:** `components/layout/banner.tsx`
  - **Purpose:** Displays the NGDI logo. It should link to the homepage (`/`).
  - **Styling:** Fixed or sticky at the very top of the page.
  - **Directive:** Likely `"use server"` if it's purely presentational, or `"use client"` if it has interactive elements (though unlikely for a simple banner).
- **`MainHeader` Component:**
  - **File:** `components/layout/main-header.tsx`
  - **Purpose:** Acts as the main application header, positioned directly below the `Banner`. It will contain the `GlobalSearchBar` and `NavigationLinks` components.
  - **Directive:** Likely `"use client"` if the navigation or search bar has client-side interactions (e.g., dropdowns, dynamic input).
- **`GlobalSearchBar` Component:**
  - **File:** `components/search/global-search-bar.tsx`
  - **Purpose:** An input field for site-wide search.
  - **Functionality:** On submission (e.g., pressing Enter or clicking a search button), it should navigate to a dedicated search results page (e.g., `/search` or `/(app)/search/page.tsx` depending on your route structure after the planned marketing page consolidation).
  - **Directive:** `"use client"` to handle user input and navigation.
- **`NavigationLinks` Component:**
  - **File:** `components/layout/navigation-links.tsx`
  - **Purpose:** Renders a list of primary navigation links.
  - **Content (Example):** The specific links will need to be defined based on your site structure and PRD (e.g., `NGDI_Portal_PRD.md`). Possible links:
    - Home (`/`)
    - Search (e.g., `/(app)/search`)
    - Map (`/map`)
    - About (e.g., `/(app)/about`)
    - Publications (e.g., `/(app)/publications`)
    - Contact (e.g., `/(app)/contact`)
  - **Directive:** `"use client"` if any links involve dropdown menus or dynamic behavior.

**2. Update the Root Layout (`app/layout.tsx`):**

The `app/layout.tsx` file will be modified to incorporate these new components, establishing the global structure for your entire application.

```tsx
// app/layout.tsx
"use server"

import { Inter } from "next/font/google"
import "./globals.css" // Your global stylesheets
import Banner from "@/components/layout/banner"
import MainHeader from "@/components/layout/main-header"
// If you use PostHog globally, ensure its provider is here.
// import { PHProvider } from "@/components/utilities/posthog/posthog-provider";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "NGDI Portal", // Or your desired default title
  description: "National Geospatial Data Infrastructure Portal" // Default description
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    // <PHProvider> // Uncomment if PostHog is used
    <html lang="en">
      <body className={inter.className}>
        <Banner />
        <MainHeader />
        <main className="container mx-auto px-4 py-8">
          {" "}
          {/* Example main content styling */}
          {children}
        </main>
        {/* You could add a GlobalFooter component here if needed */}
      </body>
    </html>
    // </PHProvider> // Uncomment if PostHog is used
  )
}
```

**3. Handling Existing Layouts and Pages:**

- **`app/page.tsx` (Root Landing Page):**
  - This page will now automatically be wrapped by the new `RootLayout`, inheriting the banner and header. Its content will render within the `<main>` section of `RootLayout`.
- **`app/(app)/*` Pages:**
  - Pages within the `(app)` route group will also inherit the new `RootLayout`.
  - If you have an `app/(app)/layout.tsx` (or plan to create one, perhaps from moving `app/(marketing)/layout.tsx` as per `docs/cursor_landing_page_layout_planning.md`), its content will be nested _inside_ the `RootLayout`'s `<main>` tag. You'll need to ensure `app/(app)/layout.tsx` doesn't duplicate the banner/header and only provides layout elements specific to the `(app)` section (e.g., a secondary sidebar).
- **`app/(marketing)/*` Pages and `app/(marketing)/layout.tsx`:**
  - Your plan outlined in `docs/cursor_landing_page_layout_planning.md` was to move content from `app/(marketing)/` to `app/(app)/`.
  - Once these pages are moved (e.g., `app/(marketing)/about/` becomes `app/(app)/about/`), they will automatically adopt the new `RootLayout`.
  - The old `app/(marketing)/layout.tsx` would then be either removed or its relevant parts merged into `app/(app)/layout.tsx` if that group needs its own sub-layout under the global one. The `app/(marketing)/` directory could then be deleted.
- **`app/(auth)/layout.tsx` (Login, Signup pages):**

  - Authentication pages (like login, signup) often require a simpler layout without the main navigation, banner, or header.
  - Currently, `app/(auth)/layout.tsx` will also inherit the new `RootLayout`.
  - **Decision Needed:** Do you want the global banner and header on authentication pages?

    - **If yes:** No major changes are needed for `app/(auth)/layout.tsx` beyond ensuring its content renders correctly within the new global structure.
    - **If no (Recommended for auth pages):** `app/(auth)/layout.tsx` needs to be defined as a distinct root layout template. This means it will manage its own `<html>` and `<body>` tags and will not be wrapped by `app/layout.tsx`.
      Example for a standalone `app/(auth)/layout.tsx`:

      ```tsx
      // app/(auth)/layout.tsx
      "use server"
      import "../globals.css" // Import necessary global styles

      export const metadata = {
        title: "Authentication - NGDI Portal"
      }

      export default function AuthLayout({
        children
      }: {
        children: React.ReactNode
      }) {
        return (
          <html lang="en">
            <body className="bg-gray-100 flex items-center justify-center min-h-screen">
              {" "}
              {/* Example minimal styling */}
              <div className="p-8 bg-white shadow-md rounded-lg">
                {children}
              </div>
            </body>
          </html>
        )
      }
      ```

**4. Styling and Content Details:**

- **Styling:** Use Tailwind CSS for styling all new components (`Banner`, `MainHeader`, `GlobalSearchBar`, `NavigationLinks`) and for adjusting the main content area in `RootLayout`. Ensure the layout is responsive.
- **NGDI Logo:** The actual path to the NGDI logo image asset will be needed for the `Banner` component.
- **Navigation Links:** Finalize the list of links for `NavigationLinksComponent` and their corresponding paths.
- **Search Bar:** Confirm the target route for the `GlobalSearchBar`.

**5. Next Steps (After You Review This Plan):**

1.  Confirm this overall approach.
2.  Decide on the layout for the `app/(auth)/` group.
3.  Provide the specific list of navigation links and their destination routes.
4.  Clarify the exact path for the NGDI logo asset.
5.  If the migration of pages from `app/(marketing)/` to `app/(app)/` is not yet complete, it should be addressed as part of this refactor to ensure all pages use the new unified layout.

Once these points are clarified, I can help you generate the code for the new components and update `app/layout.tsx`. How does this plan look to you?

```typescriptreact
// app/layout.tsx
"use server";

import { Inter } from "next/font/google";
import "./globals.css"; // Your global stylesheets
import Banner from "@/components/layout/banner";
import MainHeader from "@/components/layout/main-header";
// If you use PostHog globally, ensure its provider is here.
// import { PHProvider } from "@/components/utilities/posthog/posthog-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NGDI Portal", // Or your desired default title
  description: "National Geospatial Data Infrastructure Portal", // Default description
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <PHProvider> // Uncomment if PostHog is used
      <html lang="en">
        <body className={inter.className}>
          <Banner />
          <MainHeader />
          <main className="container mx-auto px-4 py-8"> {/* Example main content styling */}
            {children}
          </main>
          {/* You could add a GlobalFooter component here if needed */}
        </body>
      </html>
    // </PHProvider> // Uncomment if PostHog is used
  );
}
```

```typescriptreact
            // app/(auth)/layout.tsx
            "use server";
            import "../globals.css"; // Import necessary global styles

            export const metadata = {
              title: "Authentication - NGDI Portal",
            };

            export default function AuthLayout({ children }: { children: React.ReactNode }) {
              return (
                <html lang="en">
                  <body className="bg-gray-100 flex items-center justify-center min-h-screen"> {/* Example minimal styling */}
                    <div className="p-8 bg-white shadow-md rounded-lg">
                      {children}
                    </div>
                  </body>
                </html>
              );
            }
```

---

**User**

The link to the logo is in public/img/logo.png.
The search should be for search available metadata records and other things on the app.

make sure no more duplicate layout code files after.

---

**Cursor**

Okay, I've incorporated your clarifications.

- The logo is at `public/img/logo.png`.
- The search bar will lead to a page for searching metadata records and other app content.
- We will ensure no duplicate layout code files remain.

Here's the refined plan:

**Phase 1: Create New Global Layout Components**

We'll place these in `components/layout/` or `components/search/` as appropriate.

1.  **`Banner` Component (`components/layout/banner.tsx`)**

    - Displays the NGDI logo, linking to the homepage (`/`).
    - It will be a server component.

2.  **`GlobalSearchBar` Component (`components/search/global-search-bar.tsx`)**

    - Input field for site-wide search.
    - On submission, navigates to a dedicated search results page (let's plan for `/search` as a top-level route for now; we can adjust if needed).
    - This will be a client component.

3.  **`NavigationLinks` Component (`components/layout/navigation-links.tsx`)**

    - Renders primary navigation links. Based on your PRD and common app structures, example links:
      - Home (`/`)
      - Search (`/search`)
      - Map (`/map`)
      - About (`/about`) - assuming this moves from `(marketing)`
      - Publications (`/publications`) - assuming this moves from `(marketing)`
      - Contact (`/contact`) - assuming this moves from `(marketing)`
    - This will be a client component due to potential active link highlighting or dropdowns.

4.  **`MainHeader` Component (`components/layout/main-header.tsx`)**
    - Contains `GlobalSearchBar` and `NavigationLinks`.
    - Positioned below the `Banner`.
    - This will be a client component.

**Phase 2: Update Root Layout (`app/layout.tsx`)**

I'll need to read the current content of `app/layout.tsx` to ensure we integrate correctly with existing providers (like PostHog, fonts, global CSS).

Then, I'll propose changes to `app/layout.tsx` to include the new `Banner` and `MainHeader`. The children of this layout will be rendered within a `<main>` tag below the header.

**Phase 3: Handle Specific Route Group Layouts**

1.  **Authentication Layout (`app/(auth)/layout.tsx`)**

    - This layout will be a standalone root layout (i.e., it will have its own `<html>` and `<body>` tags) specifically for pages like login and signup. It _will not_ include the global `Banner` and `MainHeader` for a cleaner, focused authentication experience.
    - I'll check if `app/(auth)/layout.tsx` exists and what its current structure is.

2.  **Main Application Layout (`app/(app)/layout.tsx`)**

    - As per your previous request (`docs/cursor_landing_page_layout_planning.md`), functionality from `app/(marketing)/` (including its layout) will be moved into `app/(app)/`.
    - The current `app/(marketing)/layout.tsx` will likely become the new `app/(app)/layout.tsx`.
    - This `app/(app)/layout.tsx` will be a _child layout_ of the `RootLayout` (`app/layout.tsx`). It should **not** duplicate the `Banner` or `MainHeader`. It should only contain layout elements specific to the `(app)` section (e.g., a sidebar, secondary navigation).
    - I will read `app/(marketing)/layout.tsx` and `app/(app)/layout.tsx` (if it exists) to guide this.

3.  **Admin and Node Officer Layouts (`app/(admin)/layout.tsx`, `app/(node-officer)/layout.tsx`)**
    - These will also be child layouts of the `RootLayout`. They should not duplicate the `Banner` or `MainHeader`. They should only provide layout elements specific to their sections.

**Phase 4: Consolidate `(marketing)` routes into `(app)`**

- As per `docs/cursor_landing_page_layout_planning.md`:
  - Move all subdirectories from `app/(marketing)/` to `app/(app)/`.
  - Move `app/(marketing)/page.tsx` to `app/(app)/page.tsx`.
  - Move `app/(marketing)/layout.tsx` to `app/(app)/layout.tsx` (and ensure it's a child layout as described in Phase 3.2).
  - Delete the `app/(marketing)/` directory.

**Next Steps:**

I will start by reading the content of:

1.  `app/layout.tsx`
2.  `app/(auth)/layout.tsx` (if it exists)
3.  `app/(marketing)/layout.tsx`
4.  `app/(app)/layout.tsx` (if it exists)

This will allow me to provide you with the precise code for the new components and the necessary updates to your existing layout files, ensuring we eliminate duplication and achieve the unified structure you're looking for.

Okay, I've reviewed the existing layout files. Here's what I found and how it shapes the plan:

- **`app/layout.tsx` (Root Layout):**

  - It already uses `ClerkProvider`, `Providers` (for theme), `SidebarProvider`, `PostHogUserIdentify`, `PostHogPageview`, `Toaster`, and `TailwindIndicator`.
  - It includes a `Sidebar` and a `Footer`. The main content is rendered in `<main className="flex-1 md:pl-64">{children}</main>`.
  - The new `Banner` and `MainHeader` will need to be integrated into this structure, likely _outside_ the `flex min-h-screen` div that holds the sidebar and main content, but _inside_ the `Providers` and `SidebarProvider`. The existing `Sidebar` and `Footer` will likely be affected or replaced by the new global layout elements.

- **`app/(auth)/layout.tsx`:**

  - It's a very simple server component that centers its children on the screen.
  - It does _not_ have its own `<html>` or `<body>` tags, meaning it's currently a child of `app/layout.tsx`.
  - As planned, we will change this to be a standalone root layout for auth pages, so it won't inherit the global banner, header, sidebar, or footer.

- **`app/(marketing)/layout.tsx`:**

  - This file _does not exist_. This simplifies things as there's no marketing-specific layout to merge from that location.

- **`app/(app)/layout.tsx`:**
  - This file _exists_ and is named `MarketingLayout` in the code. It uses a `Header` component (likely `components/header.tsx`) and a `Footer` component.
  - This `Header` is probably what you want to replace with the new `MainHeader` (which includes the search bar and nav links).
  - This layout will become a child of the new `RootLayout`. The `Header` and `Footer` components currently used here will likely be removed from this file, as those functionalities will be handled by the global `Banner`, `MainHeader`, and potentially a new global `Footer` if the existing one in `app/layout.tsx` is not suitable for the new design.

**Refined Plan Based on Findings:**

**Phase 1: Create New Global Layout Components**

No changes to this part of the plan. We will create:

- `components/layout/banner.tsx`
- `components/search/global-search-bar.tsx`
- `components/layout/navigation-links.tsx`
- `components/layout/main-header.tsx`

**Phase 2: Update Root Layout (`app/layout.tsx`)**

- Integrate `Banner` and `MainHeader` at the top level.
- The existing `Sidebar` and `<main className="flex-1 md:pl-64">{children}</main>` structure will need to be placed _underneath_ the new `MainHeader`.
- The existing `Footer` in `app/layout.tsx` might need to be reviewed. If it's a global footer for the entire site, it can remain. If the new design implies a different footer or no footer for certain sections, we'll adjust. For now, let's assume it can remain as a global footer.

**Phase 3: Handle Specific Route Group Layouts**

1.  **Authentication Layout (`app/(auth)/layout.tsx`)**

    - This will be modified to be a standalone root layout with its own `<html>` and `<body>` tags.

2.  **Main Application Layout (`app/(app)/layout.tsx`)**

    - The existing `Header` and `Footer` imports and usage within this file will be **removed**.
    - This layout will essentially become a pass-through for its children, or it can define structure _within_ the main content area provided by `app/layout.tsx` (e.g., if `(app)` routes needed a specific padding or background that differs from other root pages). For now, it will likely simplify to just `{children}`.

3.  **Consolidate `(marketing)` routes into `(app)`**
    - Since `app/(marketing)/layout.tsx` doesn't exist, this step simplifies to:
      - Moving subdirectories from `app/(marketing)/` to `app/(app)/`.
      - Moving `app/(marketing)/page.tsx` to `app/(app)/page.tsx` (if it exists).
      - Deleting the `app/(marketing)/` directory.

Let's start by generating the code for the new components and then the updated layout files.

**New Component Definitions:**

**1. Banner Component**
I will create `components/layout/banner.tsx`.

**2. Global Search Bar Component**
I will create `components/search/global-search-bar.tsx`.

**3. Navigation Links Component**
I will create `components/layout/navigation-links.tsx`.
What are the exact navigation links you want and their corresponding paths? For example:

- Home: `/`
- Search: `/search`
- Map: `/map`
- About: `/about`
- Docs: `/docs`
- Contact: `/contact`

**4. Main Header Component**
I will create `components/layout/main-header.tsx`.

Once you provide the navigation links, I'll generate these components. Then we'll move to updating the layout files.

---

**User**

Home, Search, Map, aboout, publications, and news. Make sure to arrange them appropriately.

---

**Cursor**

Okay, I have the navigation links: Home (`/`), Search (`/search`), Map (`/map`), About (`/about`), Publications (`/publications`), and News (`/news`).

I'll arrange them in a logical order.

Let's proceed with creating the new components.

**1. Banner Component**
This component will display the NGDI logo and link to the homepage.
It will be created at `components/layout/banner.tsx`.

```typescript
// components/layout/banner.tsx
"use server";

import Image from "next/image";
import Link from "next/link";

export default async function Banner() {
  return (
    <div className="bg-slate-700 p-2 text-white"> {/* Example styling */}
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/img/logo.png"
            alt="NGDI Logo"
            width={40} // Adjust as needed
            height={40} // Adjust as needed
            className="mr-2"
          />
          <span className="text-lg font-semibold">NGDI Portal</span>
        </Link>
        {/* You can add other elements to the banner here if needed */}
      </div>
    </div>
  );
}
```

**2. Global Search Bar Component**
This component will provide the search functionality.
It will be created at `components/search/global-search-bar.tsx`.

```typescript
// components/search/global-search-bar.tsx
"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center">
      <Input
        type="search"
        placeholder="Search metadata, content..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-md border pl-10 pr-4 py-2 md:w-64 lg:w-96" // Added padding for icon
      />
      <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
    </form>
  );
}
```

**3. Navigation Links Component**
This component will render the navigation links.
It will be created at `components/layout/navigation-links.tsx`.

```typescript
// components/layout/navigation-links.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
  { href: "/publications", label: "Publications" },
  { href: "/news", label: "News" },
];

export default function NavigationLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "hover:text-primary text-sm font-medium transition-colors",
            pathname === link.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

**4. Main Header Component**
This component will house the `GlobalSearchBar` and `NavigationLinks`.
It will be created at `components/layout/main-header.tsx`.

```typescript
// components/layout/main-header.tsx
"use client";

import GlobalSearchBar from "@/components/search/global-search-bar";
import NavigationLinks from "./navigation-links";

export default function MainHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background"> {/* Example styling */}
      <div className="container mx-auto flex h-16 items-center justify-between space-x-4 px-4 sm:space-x-0">
        <div className="hidden md:flex"> {/* Hide nav links on small screens, show search bar */}
           <NavigationLinks />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
           <GlobalSearchBar />
          {/* Add UserProfile/Auth button here if needed, e.g., from Clerk */}
        </div>
      </div>
    </header>
  );
}
```

Now, I will provide the updated layout files.

**Updated `app/layout.tsx` (Root Layout):**

This layout will incorporate the new `Banner` and `MainHeader`. The existing `SidebarProvider` and its contents (including the `Sidebar`) will be nested within the main content area.

```typescript
// app/layout.tsx
"use server";

import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions";
import Banner from "@/components/layout/banner"; // New
import MainHeader from "@/components/layout/main-header"; // New
import { Toaster } from "@/components/ui/toaster";
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview";
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity";
import { Providers } from "@/components/utilities/providers";
import { SidebarProvider } from "@/components/utilities/sidebar-provider"; // Keep for pages that use it
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator";
import { db } from "@/db/db";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/footer"; // Keep global footer for now
import Sidebar from "@/components/sidebar/sidebar"; // Keep for pages that use it
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NGDI Portal", // Updated
  description: "National Geospatial Data Infrastructure Portal", // Updated
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEST QUERY (Keeping existing logic)
  try {
    console.log("Attempting test query on todosTable...");
    const testTodos = await db.query.todos.findMany({ limit: 1 });
    console.log("Test query successful:", testTodos);
  } catch (e: any) {
    console.error("Test query FAILED:", e.message);
    // ... (rest of existing error handling)
  }

  const { userId } = await auth();

  if (userId) {
    const profileRes = await getProfileByUserIdAction(userId);
    if (!profileRes.isSuccess) {
      await createProfileAction({ userId });
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background min-h-screen w-full scroll-smooth antialiased",
            inter.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <PostHogUserIdentify />
            <PostHogPageview />

            <Banner />
            <MainHeader />

            {/* Content area: SidebarProvider wraps the part of the app that uses the sidebar */}
            {/* This allows some pages (like auth) to not inherit the sidebar automatically if their own layout is standalone */}
            <SidebarProvider>
              <div className="flex min-h-[calc(100vh-var(--header-height)-var(--banner-height))]"> {/* Adjust height based on Banner/Header actual heights */}
                <Sidebar /> {/* Sidebar is rendered here, controlled by SidebarProvider */}
                <main className="flex-1 md:pl-64">{children}</main> {/* Main content area */}
              </div>
            </SidebarProvider>

            <Footer />

            <TailwindIndicator />
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

_Note on `min-h-[calc(100vh-var(--header-height)-var(--banner-height))]`_: You'll need to define `--header-height` and `--banner-height` as CSS variables in your `globals.css` (or use Tailwind's JIT compilation for direct values if you know them, e.g., `min-h-[calc(100vh-4rem-2rem)]` if header is `h-16` (4rem) and banner is `h-8` (2rem)). For example, in `globals.css`:

```css
:root {
  --banner-height: 2.5rem; /* Adjust to actual banner height e.g. p-2 -> 0.5rem padding top/bottom + content */
  --header-height: 4rem; /* h-16 */
}
```

**Updated `app/(auth)/layout.tsx`:**
This layout will be standalone, without the global banner/header/sidebar/footer.

```typescript
// app/(auth)/layout.tsx
"use server";

import "../globals.css"; // Import global styles if needed by auth pages
import { Inter } from "next/font/google"; // If you want consistent font
import { cn } from "@/lib/utils";
import { Providers } from "@/components/utilities/providers"; // For theme consistency
import { Toaster } from "@/components/ui/toaster"; // If auth pages might show toasts

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Authentication - NGDI Portal",
  description: "Login or sign up for the NGDI Portal.",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background min-h-screen w-full scroll-smooth antialiased",
          inter.className
        )}
      >
        <Providers
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
              {children}
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

**Updated `app/(app)/layout.tsx`:**
This layout will no longer include its own `Header` or `Footer`, as those are now global. It will become a simple pass-through or can be used for `(app)`-specific structural elements that should be _inside_ the main content area.

```typescript
// app/(app)/layout.tsx
"use server";

// Remove imports for Header and Footer from here if they existed.
// import Header from "@/components/header";
// import Footer from "@/components/footer";

export default async function AppPagesLayout({ // Renamed for clarity from MarketingLayout
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div can be used if (app) pages need a common wrapper INSIDE the main content area.
    // For now, it's a simple pass-through.
    // If your (app) pages don't need a specific sub-layout beyond what RootLayout provides,
    // this file could even be removed, and Next.js would just use app/layout.tsx.
    // However, keeping it might be useful for future (app)-specific adjustments.
    <div className="w-full">
      {children}
    </div>
  );
}
```

**Consolidation of `(marketing)` routes:**

- As previously discussed, you will need to manually:
  1.  Move all subdirectories from `app/(marketing)/` to `app/(app)/`.
  2.  If `app/(marketing)/page.tsx` exists, move it to `app/(app)/page.tsx`. (This will become the page at the `/` route if your `(app)` group is the root for logged-in users, or at the root of the `(app)` group if you have another `app/page.tsx` for the public landing page).
  3.  Delete the `app/(marketing)/` directory.

**Important Considerations:**

1.  **CSS Variables for Heights:** Ensure you define `--banner-height` and `--header-height` in your `globals.css` for the `min-h-screen` calculation in `app/layout.tsx` to work correctly, or replace them with direct Tailwind values.
2.  **Sidebar Visibility:** The `Sidebar` is still present in `app/layout.tsx`. It will be available for pages that are children of this layout. If some pages under `(app)` should _not_ show the sidebar, you'll need more specific layout files for those routes or logic within your `SidebarProvider` / `Sidebar` component to control its visibility based on the route.
3.  **User Profile/Auth Button in Header:** The `MainHeader` component has a comment `// Add UserProfile/Auth button here if needed`. You'll likely want to add Clerk's `<UserButton />` or custom login/signup links there.
4.  **Tailwind `container` Class:** The `MainHeader` and `Banner` use `container mx-auto`. Ensure this provides the desired width and centering. The `app/layout.tsx`'s `<main>` tag does not currently have `container mx-auto`, but it was in the example plan. You might want to add it there or to `app/(app)/layout.tsx`'s wrapping `div` if you want the content of `(app)` pages to be constrained.

This set of changes establishes the new global layout. Please review them. After you apply these, you'll need to test thoroughly. Let me know if you have questions or want to proceed with any further refinements.

```typescript
// components/layout/banner.tsx
"use server";

import Image from "next/image";
import Link from "next/link";

export default async function Banner() {
  return (
    <div className="bg-slate-700 p-2 text-white"> {/* Example styling */}
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/img/logo.png"
            alt="NGDI Logo"
            width={40} // Adjust as needed
            height={40} // Adjust as needed
            className="mr-2"
          />
          <span className="text-lg font-semibold">NGDI Portal</span>
        </Link>
        {/* You can add other elements to the banner here if needed */}
      </div>
    </div>
  );
}
```

```typescript
// components/search/global-search-bar.tsx
"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center">
      <Input
        type="search"
        placeholder="Search metadata, content..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-md border pl-10 pr-4 py-2 md:w-64 lg:w-96" // Added padding for icon
      />
      <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
    </form>
  );
}
```

```typescript
// components/layout/navigation-links.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
  { href: "/publications", label: "Publications" },
  { href: "/news", label: "News" },
];

export default function NavigationLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "hover:text-primary text-sm font-medium transition-colors",
            pathname === link.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

```typescript
// components/layout/main-header.tsx
"use client";

import GlobalSearchBar from "@/components/search/global-search-bar";
import NavigationLinks from "./navigation-links";

export default function MainHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background"> {/* Example styling */}
      <div className="container mx-auto flex h-16 items-center justify-between space-x-4 px-4 sm:space-x-0">
        <div className="hidden md:flex"> {/* Hide nav links on small screens, show search bar */}
           <NavigationLinks />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
           <GlobalSearchBar />
          {/* Add UserProfile/Auth button here if needed, e.g., from Clerk */}
        </div>
      </div>
    </header>
  );
}
```

```typescript
// app/layout.tsx
"use server";

import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions";
import Banner from "@/components/layout/banner"; // New
import MainHeader from "@/components/layout/main-header"; // New
import { Toaster } from "@/components/ui/toaster";
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview";
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity";
import { Providers } from "@/components/utilities/providers";
import { SidebarProvider } from "@/components/utilities/sidebar-provider"; // Keep for pages that use it
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator";
import { db } from "@/db/db";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/footer"; // Keep global footer for now
import Sidebar from "@/components/sidebar/sidebar"; // Keep for pages that use it
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NGDI Portal", // Updated
  description: "National Geospatial Data Infrastructure Portal", // Updated
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEST QUERY (Keeping existing logic)
  try {
    console.log("Attempting test query on todosTable...");
    const testTodos = await db.query.todos.findMany({ limit: 1 });
    console.log("Test query successful:", testTodos);
  } catch (e: any) {
    console.error("Test query FAILED:", e.message);
    // ... (rest of existing error handling)
  }

  const { userId } = await auth();

  if (userId) {
    const profileRes = await getProfileByUserIdAction(userId);
    if (!profileRes.isSuccess) {
      await createProfileAction({ userId });
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background min-h-screen w-full scroll-smooth antialiased",
            inter.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <PostHogUserIdentify />
            <PostHogPageview />

            <Banner />
            <MainHeader />

            {/* Content area: SidebarProvider wraps the part of the app that uses the sidebar */}
            {/* This allows some pages (like auth) to not inherit the sidebar automatically if their own layout is standalone */}
            <SidebarProvider>
              <div className="flex min-h-[calc(100vh-var(--header-height)-var(--banner-height))]"> {/* Adjust height based on Banner/Header actual heights */}
                <Sidebar /> {/* Sidebar is rendered here, controlled by SidebarProvider */}
                <main className="flex-1 md:pl-64">{children}</main> {/* Main content area */}
              </div>
            </SidebarProvider>

            <Footer />

            <TailwindIndicator />
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

```css
:root {
  --banner-height: 2.5rem; /* Adjust to actual banner height e.g. p-2 -> 0.5rem padding top/bottom + content */
  --header-height: 4rem; /* h-16 */
}
```

```typescript
// app/(auth)/layout.tsx
"use server";

import "../globals.css"; // Import global styles if needed by auth pages
import { Inter } from "next/font/google"; // If you want consistent font
import { cn } from "@/lib/utils";
import { Providers } from "@/components/utilities/providers"; // For theme consistency
import { Toaster } from "@/components/ui/toaster"; // If auth pages might show toasts

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Authentication - NGDI Portal",
  description: "Login or sign up for the NGDI Portal.",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background min-h-screen w-full scroll-smooth antialiased",
          inter.className
        )}
      >
        <Providers
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
              {children}
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

```typescript
// app/(app)/layout.tsx
"use server";

// Remove imports for Header and Footer from here if they existed.
// import Header from "@/components/header";
// import Footer from "@/components/footer";

export default async function AppPagesLayout({ // Renamed for clarity from MarketingLayout
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div can be used if (app) pages need a common wrapper INSIDE the main content area.
    // For now, it's a simple pass-through.
    // If your (app) pages don't need a specific sub-layout beyond what RootLayout provides,
    // this file could even be removed, and Next.js would just use app/layout.tsx.
    // However, keeping it might be useful for future (app)-specific adjustments.
    <div className="w-full">
      {children}
    </div>
  );
}
```

I've reviewed `components/header.tsx`. Here's a summary and how it impacts the plan:

- **Current `components/header.tsx` Functionality:**
  - Displays a logo ("Mckay's App Template" with a Rocket icon) linking to `/`.
  - Has a set of navigation links: "About", "Pricing", "Contact".
  - Has signed-in specific links: "Todo".
  - Includes `ThemeSwitcher`.
  - Includes Clerk's `SignedIn`, `SignedOut`, `SignInButton`, `SignUpButton`, and `UserButton` for authentication state and actions.
  - Has a mobile-responsive menu (`isMenuOpen` state) that shows links when the hamburger icon is clicked.
  - Changes background/shadow on scroll (`isScrolled` state).

**Impact on the New Layout Plan:**

1.  **Logo:** The new `Banner` component already handles the NGDI logo and portal name, linking to `/`. The "Mckay's App Template" logo from `components/header.tsx` will be superseded by the `Banner`.
2.  **Navigation Links:**
    - The existing public nav links ("About", "Pricing", "Contact") will be replaced by the new set you provided ("Home", "Search", "Map", "About", "Publications", "News") in `components/layout/navigation-links.tsx`.
    - The signed-in link ("Todo") needs to be decided upon. Should it be part of the new `NavigationLinks` (perhaps conditionally shown if logged in), or part of the user menu (e.g., within `UserButton`'s dropdown if Clerk's component supports that), or accessible elsewhere (like the `Sidebar`)?
3.  **ThemeSwitcher:** This is a useful utility. It should be moved into the new `MainHeader` component.
4.  **Authentication Buttons (`SignInButton`, `SignUpButton`, `UserButton`):** These are critical for user authentication and should be moved into the new `MainHeader` component.
5.  **Mobile Menu:** The new `MainHeader` and `NavigationLinks` components will need to implement their own mobile-responsive behavior. The current logic in `components/header.tsx` can serve as a reference, but it will need to be adapted to the new structure. The `MainHeader` is currently set up to hide `NavigationLinks` on small screens (`md:flex`) and keep the `GlobalSearchBar`. We'll need to add a mobile menu toggle to `MainHeader` that can display `NavigationLinks`.
6.  **Scroll Behavior:** The `isScrolled` state that changes header appearance is a nice touch. This styling can be applied to the new `MainHeader` component.

**Revised Plan for `MainHeader` and Related Elements:**

- **`components/layout/main-header.tsx` will be enhanced to include:**

  - `ThemeSwitcher`
  - Clerk's `SignedIn`, `SignedOut`, `SignInButton`, `SignUpButton`, `UserButton`.
  - Logic for a mobile menu (displaying `NavigationLinks`).
  - Scroll-based styling changes.

- **`components/header.tsx` will be DELETED** after its relevant functionalities are migrated to the new components.

- **`components/layout/navigation-links.tsx`:**

  - We need to decide where the "Todo" link (or other authenticated user-specific navigation) should go.
    - **Option A:** Include it in `NavigationLinks` and conditionally render it based on authentication status.
    - **Option B:** Rely on the `Sidebar` (which is kept in `app/layout.tsx`) for such authenticated app-specific links. The existing `Sidebar` is likely a good place for "Todo" and similar items.
    - **Option C:** If `UserButton` (from Clerk) offers a dropdown, it could be a place for links like "Profile", "Settings", and perhaps "Todo".

  For now, let's assume **Option B** is preferred, meaning the `Sidebar` will handle links like "Todo". The new `NavigationLinks` will focus on global site navigation.

**Updated `components/layout/main-header.tsx` code proposal:**

This will be a more complex component now.

```typescript
// components/layout/main-header.tsx
"use client";

import GlobalSearchBar from "@/components/search/global-search-bar";
import NavigationLinks from "./navigation-links";
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"; // Assuming this path
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket } from "lucide-react"; // Added Rocket if you want to keep a similar branding element
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link"; // For the logo/brand link

export default function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors",
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between space-x-4 px-4 sm:justify-between sm:space-x-0">
        {/* Optional: If you want a small branding element in the header itself, distinct from the top banner */}
        {/* <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center text-lg font-semibold hover:opacity-80">
            <Rocket className="mr-2 h-5 w-5" /> Portal
          </Link>
        </div> */}

        <div className="hidden flex-1 items-center justify-center md:flex">
          <NavigationLinks />
        </div>

        <div className="flex items-center justify-end space-x-2 md:flex-1 md:justify-end">
          <GlobalSearchBar />
          <ThemeSwitcher />

          <SignedOut>
            <SignInButton>
              <Button variant="outline" size="sm">Login</Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container mx-auto flex flex-col space-y-2 p-4">
            <NavigationLinks />
            {/* You can add more links here specifically for the mobile menu if needed */}
          </nav>
        </div>
      )}
    </header>
  );
}
```

**Next Steps:**

1.  **Confirm "Todo" link placement:** Is placing it in the `Sidebar` acceptable, or do you want it in the `MainHeader`'s navigation (conditionally for signed-in users)? _For now, I've omitted it from `NavigationLinks` assuming it goes in the `Sidebar`._
2.  **Branding in `MainHeader`:** The `Banner` component provides the main NGDI logo. The `components/header.tsx` had "Mckay's App Template" with a rocket icon. I've commented out a similar branding element in the new `MainHeader`. Do you want any secondary branding in the `MainHeader`, or is the `Banner` sufficient?
3.  **Apply Component and Layout Changes:**
    - Create `components/layout/banner.tsx`.
    - Create `components/search/global-search-bar.tsx`.
    - Create `components/layout/navigation-links.tsx` (with the links Home, Search, Map, About, Publications, News).
    - Create the updated `components/layout/main-header.tsx` (as proposed above).
    - Apply the changes to `app/layout.tsx`.
    - Apply the changes to `app/(auth)/layout.tsx`.
    - Apply the changes to `app/(app)/layout.tsx`.
    - **Delete `components/header.tsx`**.
    - Perform the `(marketing)` to `(app)` route consolidation.
    - Add CSS variables for banner/header heights in `globals.css`.

This is a comprehensive set of changes. After you confirm the pending questions, I can provide the final code blocks for you to apply. Remember to do this on a separate branch and test thoroughly!

```typescript
// components/layout/main-header.tsx
"use client";

import GlobalSearchBar from "@/components/search/global-search-bar";
import NavigationLinks from "./navigation-links";
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"; // Assuming this path
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket } from "lucide-react"; // Added Rocket if you want to keep a similar branding element
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link"; // For the logo/brand link

export default function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors",
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between space-x-4 px-4 sm:justify-between sm:space-x-0">
        {/* Optional: If you want a small branding element in the header itself, distinct from the top banner */}
        {/* <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center text-lg font-semibold hover:opacity-80">
            <Rocket className="mr-2 h-5 w-5" /> Portal
          </Link>
        </div> */}

        <div className="hidden flex-1 items-center justify-center md:flex">
          <NavigationLinks />
        </div>

        <div className="flex items-center justify-end space-x-2 md:flex-1 md:justify-end">
          <GlobalSearchBar />
          <ThemeSwitcher />

          <SignedOut>
            <SignInButton>
              <Button variant="outline" size="sm">Login</Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container mx-auto flex flex-col space-y-2 p-4">
            <NavigationLinks />
            {/* You can add more links here specifically for the mobile menu if needed */}
          </nav>
        </div>
      )}
    </header>
  );
}
```

```typescript
// components/layout/main-header.tsx
"use client";

import GlobalSearchBar from "@/components/search/global-search-bar";
import NavigationLinks from "./navigation-links";
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"; // Assuming this path
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket } from "lucide-react"; // Added Rocket if you want to keep a similar branding element
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link"; // For the logo/brand link

export default function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors",
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between space-x-4 px-4 sm:justify-between sm:space-x-0">
        {/* Optional: If you want a small branding element in the header itself, distinct from the top banner */}
        {/* <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center text-lg font-semibold hover:opacity-80">
            <Rocket className="mr-2 h-5 w-5" /> Portal
          </Link>
        </div> */}

        <div className="hidden flex-1 items-center justify-center md:flex">
          <NavigationLinks />
        </div>

        <div className="flex items-center justify-end space-x-2 md:flex-1 md:justify-end">
          <GlobalSearchBar />
          <ThemeSwitcher />

          <SignedOut>
            <SignInButton>
              <Button variant="outline" size="sm">Login</Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container mx-auto flex flex-col space-y-2 p-4">
            <NavigationLinks />
            {/* You can add more links here specifically for the mobile menu if needed */}
          </nav>
        </div>
      )}
    </header>
  );
}
```
