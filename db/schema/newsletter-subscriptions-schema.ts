import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const subscriptionSourceEnum = pgEnum("subscription_source", [
  "footer",
  "modal",
  "other"
])

export const newsletterSubscriptionsTable = pgTable(
  "newsletter_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    source: subscriptionSourceEnum("source").notNull().default("footer"),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  }
)

export type InsertNewsletterSubscription =
  typeof newsletterSubscriptionsTable.$inferInsert
export type SelectNewsletterSubscription =
  typeof newsletterSubscriptionsTable.$inferSelect
