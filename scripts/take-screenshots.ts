import { chromium, Browser, Page } from "@playwright/test"
import path from "path"
import fs from "fs"

const SCREENSHOT_DIR = path.join(process.cwd(), "public", "img", "screenshots")

// Seeded admin user credentials
const ADMIN_EMAIL = "admin@example.com"
const ADMIN_PASSWORD = "S3cur3@dm1nP@55w0rd!"

const scenarios = [
  {
    name: "landing-page",
    path: "/",
    waitFor: "body",
    fullPage: true,
    requiresAuth: false
  },
  {
    name: "search",
    path: "/search",
    waitFor: "body",
    fullPage: true,
    requiresAuth: false
  },
  {
    name: "metadata-search",
    path: "/metadata/search",
    waitFor: "body",
    fullPage: true,
    requiresAuth: false
  },
  {
    name: "metadata-browse",
    path: "/metadata",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  },
  {
    name: "metadata-create",
    path: "/metadata/create",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  },
  {
    name: "admin-dashboard",
    path: "/admin/dashboard",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  },
  {
    name: "admin-users",
    path: "/admin/users",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  },
  {
    name: "admin-organizations",
    path: "/admin/organizations",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  },
  {
    name: "profile-settings",
    path: "/profile",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  },
  {
    name: "notifications",
    path: "/notifications",
    waitFor: "body",
    fullPage: true,
    requiresAuth: true
  }
]

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function loginToApp(page: Page): Promise<boolean> {
  try {
    console.log("🔐 Attempting to login...")

    // Go to the landing page first
    await page.goto("http://localhost:3000/", {
      waitUntil: "networkidle",
      timeout: 90000
    })
    await page.waitForTimeout(2000)

    // Look for login button or sign in button
    const loginButton = page.locator(
      'button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), a:has-text("Sign In")'
    )

    if (await loginButton.isVisible({ timeout: 5000 })) {
      console.log("🔘 Clicking login button...")
      await loginButton.first().click()
      await page.waitForTimeout(5000) // Increased wait time
    } else {
      // Try navigating to a protected page to trigger login
      console.log("🔘 Navigating to protected page to trigger login...")
      await page.goto("http://localhost:3000/metadata/create", {
        waitUntil: "networkidle",
        timeout: 90000
      })
      await page.waitForTimeout(5000) // Increased wait time
    }

    // Wait for Clerk login form to appear
    console.log("🔍 Looking for Clerk login form...")
    await page.waitForTimeout(3000) // Give extra time for modal to load

    // Try multiple selectors for email input
    const emailSelectors = [
      'input[name="identifier"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[name="emailAddress"]',
      'input[data-testid="identifier-field"]',
      '.cl-formFieldInput[type="email"]',
      '.cl-formFieldInput[name="identifier"]'
    ]

    let emailInput = null
    for (const selector of emailSelectors) {
      emailInput = page.locator(selector)
      if (await emailInput.isVisible({ timeout: 2000 })) {
        console.log(`✅ Found email input with selector: ${selector}`)
        break
      }
    }

    if (!emailInput || !(await emailInput.isVisible({ timeout: 5000 }))) {
      console.log("❌ Email input not found")
      // Debug: Check what's actually on the page
      const pageTitle = await page.title()
      const pageUrl = page.url()
      console.log(`📄 Current page: ${pageTitle} (${pageUrl})`)

      // Check for common Clerk elements
      const clerkElements = await page
        .locator(".cl-rootBox, .cl-card, .cl-signIn, [data-clerk-id]")
        .count()
      console.log(`🔍 Found ${clerkElements} Clerk elements on page`)

      return false
    }

    // Fill email
    await emailInput.fill(ADMIN_EMAIL)
    console.log("✅ Email filled")
    await page.waitForTimeout(1000)

    // Look for continue button or submit
    const continueSelectors = [
      'button:has-text("Continue")',
      '.cl-formButtonPrimary:has-text("Continue")',
      'button[data-localization-key="formButtonPrimary"]',
      'button[type="submit"]:not([aria-hidden="true"])',
      ".cl-formButtonPrimary"
    ]

    let continueButton = null
    for (const selector of continueSelectors) {
      continueButton = page.locator(selector)
      if (await continueButton.isVisible({ timeout: 2000 })) {
        console.log(`✅ Found continue button with selector: ${selector}`)
        break
      }
    }

    if (continueButton && (await continueButton.isVisible({ timeout: 5000 }))) {
      await continueButton.first().click()
      console.log("✅ Continue button clicked")
      await page.waitForTimeout(3000)
    }

    // Now look for password input
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[data-testid="password-field"]',
      '.cl-formFieldInput[type="password"]',
      '.cl-formFieldInput[name="password"]'
    ]

    let passwordInput = null
    for (const selector of passwordSelectors) {
      passwordInput = page.locator(selector)
      if (await passwordInput.isVisible({ timeout: 2000 })) {
        console.log(`✅ Found password input with selector: ${selector}`)
        break
      }
    }

    if (!passwordInput || !(await passwordInput.isVisible({ timeout: 5000 }))) {
      console.log("❌ Password input not found")
      return false
    }

    // Fill password
    await passwordInput.fill(ADMIN_PASSWORD)
    console.log("✅ Password filled")
    await page.waitForTimeout(1000)

    // Look for sign in button
    const signInSelectors = [
      'button:has-text("Sign in")',
      'button:has-text("Sign In")',
      '.cl-formButtonPrimary:has-text("Sign")',
      'button[data-localization-key="formButtonPrimary"]',
      'button[type="submit"]:not([aria-hidden="true"])',
      ".cl-formButtonPrimary"
    ]

    let signInButton = null
    for (const selector of signInSelectors) {
      signInButton = page.locator(selector)
      if (await signInButton.isVisible({ timeout: 2000 })) {
        console.log(`✅ Found sign in button with selector: ${selector}`)
        break
      }
    }

    if (signInButton && (await signInButton.isVisible({ timeout: 5000 }))) {
      await signInButton.first().click()
      console.log("✅ Sign in button clicked")
      await page.waitForTimeout(5000)
    }

    // Wait for successful login - check for user menu or dashboard
    const authSuccessSelectors = [
      '[data-testid="user-button"]',
      ".cl-userButton",
      'button:has-text("Admin")',
      "nav",
      ".sidebar",
      '[data-testid="sidebar"]'
    ]

    let loginSuccess = false
    for (const selector of authSuccessSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 3000 })) {
        loginSuccess = true
        console.log(`✅ Login successful - found: ${selector}`)
        break
      }
    }

    if (!loginSuccess) {
      // Check if we're on a protected page successfully
      const currentUrl = page.url()
      if (
        currentUrl.includes("/metadata") ||
        currentUrl.includes("/admin") ||
        currentUrl.includes("/dashboard")
      ) {
        console.log("✅ Login successful - on protected page")
        return true
      }
    }

    return loginSuccess
  } catch (error) {
    console.log("❌ Login failed:", (error as Error).message)
    return false
  }
}

async function takeScreenshot(page: Page, scenario: any): Promise<void> {
  try {
    console.log(`📸 Taking screenshot: ${scenario.name}`)

    await page.goto("http://localhost:3000" + scenario.path, {
      waitUntil: "networkidle",
      timeout: 90000
    })

    // Wait for the page to fully load
    await page.waitForSelector(scenario.waitFor, { timeout: 30000 })
    await page.waitForTimeout(3000) // Give extra time for dynamic content

    // Check if we're on an error page or unauthorized page
    const pageContent = await page.textContent("body")
    if (
      pageContent?.includes("Access Denied") ||
      pageContent?.includes("Unauthorized") ||
      pageContent?.includes("403")
    ) {
      console.log(
        `⚠️  Skipping ${scenario.name} - Access denied or unauthorized`
      )
      return
    }

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${scenario.name}.png`)
    await page.screenshot({
      path: screenshotPath,
      fullPage: scenario.fullPage,
      type: "png"
    })

    console.log(`✅ Screenshot saved: ${scenario.name}.png`)
  } catch (error) {
    console.log(
      `❌ Failed to take screenshot for ${scenario.name}:`,
      (error as Error).message
    )
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: false, // Set to false for debugging
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  })

  const page = await context.newPage()

  try {
    // First, take screenshots of public pages
    console.log("📸 Taking screenshots of public pages...")
    for (const scenario of scenarios.filter(s => !s.requiresAuth)) {
      await takeScreenshot(page, scenario)
    }

    // Then login and take screenshots of protected pages
    console.log("🔐 Attempting to login for protected pages...")
    const loginSuccess = await loginToApp(page)

    if (loginSuccess) {
      console.log("📸 Taking screenshots of protected pages...")
      for (const scenario of scenarios.filter(s => s.requiresAuth)) {
        await takeScreenshot(page, scenario)
      }
    } else {
      console.log("⚠️  Skipping protected pages due to login failure")
    }

    console.log("✅ Screenshot process completed!")
  } catch (error) {
    console.log("❌ Screenshot process failed:", (error as Error).message)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
