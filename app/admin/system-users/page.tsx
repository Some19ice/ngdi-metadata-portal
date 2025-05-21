"use server"

import { redirect } from "next/navigation"

export default async function AdminSystemUsersPage() {
  redirect("/system-users")
}
