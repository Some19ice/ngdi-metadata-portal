"use server"

import { redirect } from "next/navigation"

export default async function AdminAuditLogsPage() {
  redirect("/audit-logs")
}
