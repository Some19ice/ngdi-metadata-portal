/*
<ai_context>
Contains the Stripe configuration for the app.
</ai_context>
*/

import Stripe from "stripe"

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2025-02-24.acacia",
    appInfo: {
      name: "Mckay's App Template",
      version: "0.1.0"
    }
  }
)
