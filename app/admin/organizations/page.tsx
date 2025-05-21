"use server"

import { redirect } from "next/navigation"

export default async function AdminOrganizationsPage() {
  redirect("/organizations")
}
