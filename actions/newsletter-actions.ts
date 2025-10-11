"use server"

import { db } from "@/db/db"
import {
  InsertNewsletterSubscription,
  newsletterSubscriptionsTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"
import { z } from "zod"

// Newsletter subscription interface (for backward compatibility)
export interface NewsletterSubscription {
  email: string
  subscribedAt: Date
  source: "footer" | "modal" | "other"
}

// Email validation schema
const emailSchema = z.string().email("Please enter a valid email address")

/**
 * Subscribe to newsletter
 * @param email - User's email address
 * @param source - Source of subscription (footer, modal, etc.)
 * @returns ActionState with success/error message
 */
export async function subscribeToNewsletterAction(
  email: string,
  source: "footer" | "modal" | "other" = "footer"
): Promise<ActionState<void>> {
  try {
    // Validate email format
    const validationResult = emailSchema.safeParse(email)

    if (!validationResult.success) {
      return {
        isSuccess: false,
        message: validationResult.error.errors[0].message
      }
    }

    const validatedEmail = validationResult.data

    // Check if email already exists
    const existingSubscription =
      await db.query.newsletterSubscriptions.findFirst({
        where: eq(newsletterSubscriptionsTable.email, validatedEmail)
      })

    if (existingSubscription) {
      return {
        isSuccess: false,
        message: "This email is already subscribed to our newsletter."
      }
    }

    // Create subscription record
    const subscription: InsertNewsletterSubscription = {
      email: validatedEmail,
      source
    }

    await db.insert(newsletterSubscriptionsTable).values(subscription)

    console.log(`Newsletter subscription: ${validatedEmail} from ${source}`)

    // TODO: Integrate with email service (SendGrid, Mailchimp, etc.)
    // TODO: Send confirmation email

    return {
      isSuccess: true,
      message: "Successfully subscribed to newsletter!",
      data: undefined
    }
  } catch (error) {
    console.error("Error subscribing to newsletter:", error)
    return {
      isSuccess: false,
      message: "Failed to subscribe. Please try again later."
    }
  }
}

/**
 * Unsubscribe from newsletter
 * @param email - User's email address
 * @returns ActionState with success/error message
 */
export async function unsubscribeFromNewsletterAction(
  email: string
): Promise<ActionState<void>> {
  try {
    // Validate email format
    const validationResult = emailSchema.safeParse(email)

    if (!validationResult.success) {
      return {
        isSuccess: false,
        message: validationResult.error.errors[0].message
      }
    }

    const validatedEmail = validationResult.data

    // Check if subscription exists
    const existingSubscription =
      await db.query.newsletterSubscriptions.findFirst({
        where: eq(newsletterSubscriptionsTable.email, validatedEmail)
      })

    if (!existingSubscription) {
      return {
        isSuccess: false,
        message: "This email is not subscribed to our newsletter."
      }
    }

    // Delete subscription
    await db
      .delete(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, validatedEmail))

    console.log(`Newsletter unsubscribe: ${validatedEmail}`)

    return {
      isSuccess: true,
      message: "Successfully unsubscribed from newsletter.",
      data: undefined
    }
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error)
    return {
      isSuccess: false,
      message: "Failed to unsubscribe. Please try again later."
    }
  }
}
