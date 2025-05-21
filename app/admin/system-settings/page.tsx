"use server"

import { redirect } from "next/navigation"

export default async function AdminSystemSettingsPage() {
  redirect("/system-settings")
}
